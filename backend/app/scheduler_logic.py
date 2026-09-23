from datetime import timedelta, date
from sqlalchemy.orm import Session
from . import models
import math

def generate_rotations(db: Session, hospital_id: int, rotation_group_id: int, start_date: date):
    """
    Generates track-isolated department rotations for HOs in a specific rotation group.
    Each department gets roughly an equal slice of the 3-month (90 days) block.
    """
    group = db.query(models.RotationGroup).filter(
        models.RotationGroup.id == rotation_group_id,
        models.RotationGroup.hospital_id == hospital_id
    ).first()
    
    if not group:
        return {"error": "Rotation group not found."}
        
    departments = group.departments
    if not departments:
        return {"error": f"No departments mapped to track '{group.name}'."}
        
    hos = db.query(models.HouseOfficer).filter(
        models.HouseOfficer.hospital_id == hospital_id,
        models.HouseOfficer.rotation_group_id == rotation_group_id
    ).all()
    
    if not hos:
        return {"error": f"No House Officers assigned to track '{group.name}'."}
        
    # Delete existing rotations for this period and group to prevent duplicates
    end_date = start_date + timedelta(days=90)
    db.query(models.Rotation).filter(
        models.Rotation.hospital_id == hospital_id,
        models.Rotation.house_officer_id.in_([ho.id for ho in hos]),
        models.Rotation.start_date >= start_date,
        models.Rotation.start_date <= end_date
    ).delete(synchronize_session=False)

    # 3 month block = 90 days. Divide by number of departments.
    days_per_dept = 90 // len(departments)
    
    rotations_to_create = []
    
    for i, ho in enumerate(hos):
        # Offset the starting department based on the HO's index to avoid everyone in the same dept
        current_start = start_date
        for j in range(len(departments)):
            dept_idx = (i + j) % len(departments)
            dept = departments[dept_idx]
            
            end_d = current_start + timedelta(days=days_per_dept - 1)
            
            rotations_to_create.append(models.Rotation(
                hospital_id=hospital_id,
                house_officer_id=ho.id,
                department_id=dept.id,
                start_date=current_start,
                end_date=end_d,
                status=models.RotationStatusEnum.Upcoming
            ))
            current_start = end_d + timedelta(days=1)
            
    db.add_all(rotations_to_create)
    db.commit()
    
    return {"message": f"Successfully generated {len(rotations_to_create)} block rotations."}

def generate_fair_shifts(db: Session, hospital_id: int, rotation_group_id: int, start_date: date, days: int = 30):
    """
    Intelligent duty scheduler for House Officers based on strict hospital rules.
    - Night duties and Sunday duties are strictly for MALE HOs.
    - Females are compensated with more weekday morning shifts.
    - Post-night off is strictly enforced.
    - Balances the overall points (workload) among all HOs.
    """
    # Fetch all active House Officers for this hospital AND rotation group
    hos = db.query(models.HouseOfficer).join(models.User).filter(
        models.HouseOfficer.hospital_id == hospital_id,
        models.HouseOfficer.rotation_group_id == rotation_group_id
    ).all()
    
    if not hos:
        return {"message": "No house officers found"}

    males = [ho for ho in hos if ho.user.gender == models.GenderEnum.Male]
    females = [ho for ho in hos if ho.user.gender == models.GenderEnum.Female]
    
    # State tracking
    points = {ho.id: 0.0 for ho in hos}
    last_night_shift = {ho.id: None for ho in hos} # Track date of last night shift
    
    # Fetch existing approved leaves in this period
    end_date = start_date + timedelta(days=days-1)
    approved_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.hospital_id == hospital_id,
        models.LeaveRequest.house_officer_id.in_([ho.id for ho in hos]),
        models.LeaveRequest.status == models.LeaveStatusEnum.Approved,
        models.LeaveRequest.leave_date >= start_date,
        models.LeaveRequest.leave_date <= end_date
    ).all()
    
    leave_map = {}
    for leave in approved_leaves:
        if leave.house_officer_id not in leave_map:
            leave_map[leave.house_officer_id] = set()
        leave_map[leave.house_officer_id].add(leave.leave_date)

    shifts_to_create = []

    # Delete existing shifts in this date range to prevent duplicates
    db.query(models.DutyShift).filter(
        models.DutyShift.hospital_id == hospital_id,
        models.DutyShift.house_officer_id.in_([ho.id for ho in hos]),
        models.DutyShift.shift_date >= start_date,
        models.DutyShift.shift_date <= end_date
    ).delete(synchronize_session=False)

    # Custom Duty Scheduler Rules:
    # 1. Night (N): Exactly 1 Male HO per day (rotates equally among males).
    # 2. Post-Night Off (O): Mandatory OFF the day after a Night duty.
    # 3. Evening (E): Exactly 1 HO per day (rotates equally among all HOs).
    # 4. Morning (M): ALL OTHER available HOs work Morning by default.

    night_counts = {ho.id: 0 for ho in hos}
    evening_counts = {ho.id: 0 for ho in hos}
    morning_counts = {ho.id: 0 for ho in hos}
    last_shift_type = {ho.id: None for ho in hos}

    import random

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        is_sunday = current_date.weekday() == 6
        
        assigned_today = set()
        
        def is_available(ho, is_night_check=False):
            if ho.id in assigned_today:
                return False
            # Check leave
            if ho.id in leave_map and current_date in leave_map[ho.id]:
                return False
            # Check post-night off
            last_night = last_night_shift.get(ho.id)
            if last_night:
                days_since_night = (current_date - last_night).days
                if days_since_night == 1:
                    return False # Post-night off
                if is_night_check and days_since_night < 2:
                    return False # Prevent back-to-back nights
            return True

        # RULE 1: Post-Night Off (O) for the Male HO who worked Night yesterday
        for ho in hos:
            last_night = last_night_shift.get(ho.id)
            if last_night and (current_date - last_night).days == 1:
                shifts_to_create.append(models.DutyShift(
                    hospital_id=hospital_id, house_officer_id=ho.id,
                    shift_date=current_date, shift_type=models.ShiftTypeEnum.Off,
                    is_weekend=is_sunday, points_assigned=0.0
                ))
                last_shift_type[ho.id] = 'Off'
                assigned_today.add(ho.id)

        # Also mark approved leaves as Off
        for ho in hos:
            if ho.id not in assigned_today and ho.id in leave_map and current_date in leave_map[ho.id]:
                shifts_to_create.append(models.DutyShift(
                    hospital_id=hospital_id, house_officer_id=ho.id,
                    shift_date=current_date, shift_type=models.ShiftTypeEnum.Off,
                    is_weekend=is_sunday, points_assigned=0.0
                ))
                last_shift_type[ho.id] = 'Off'
                assigned_today.add(ho.id)

        # RULE 1 (Night): Assign 1 Night Shift (Male HO)
        # Strictly sort by night_counts then m.id (Round-Robin) so every Male HO does exactly 1 Night per 14 days
        available_males_for_night = [m for m in males if is_available(m, is_night_check=True)]
        if not available_males_for_night:
            available_males_for_night = [m for m in males if is_available(m, is_night_check=False)]
            
        available_males_for_night.sort(key=lambda m: (night_counts[m.id], m.id))
        
        if available_males_for_night:
            night_ho = available_males_for_night.pop(0)
            shifts_to_create.append(models.DutyShift(
                hospital_id=hospital_id, house_officer_id=night_ho.id,
                shift_date=current_date, shift_type=models.ShiftTypeEnum.Night,
                is_weekend=is_sunday, points_assigned=2.0
            ))
            points[night_ho.id] += 2.0
            night_counts[night_ho.id] += 1
            last_night_shift[night_ho.id] = current_date
            last_shift_type[night_ho.id] = 'Night'
            assigned_today.add(night_ho.id)

        # RULE 3 (Evening): Exactly 1 HO per day gets Evening
        available_for_evening = [ho for ho in hos if is_available(ho) and last_shift_type[ho.id] != 'Evening']
        if not available_for_evening:
            available_for_evening = [ho for ho in hos if is_available(ho)]
            
        available_for_evening.sort(key=lambda ho: (evening_counts[ho.id], random.random()))
        
        if available_for_evening:
            evening_ho = available_for_evening.pop(0)
            shifts_to_create.append(models.DutyShift(
                hospital_id=hospital_id, house_officer_id=evening_ho.id,
                shift_date=current_date, shift_type=models.ShiftTypeEnum.Evening,
                is_weekend=is_sunday, points_assigned=1.0
            ))
            points[evening_ho.id] += 1.0
            evening_counts[evening_ho.id] += 1
            last_shift_type[evening_ho.id] = 'Evening'
            assigned_today.add(evening_ho.id)

        # RULE 2 (Morning): ALL OTHER remaining available HOs get Morning (M)
        available_for_morning = [ho for ho in hos if is_available(ho)]
        for ho in available_for_morning:
            shifts_to_create.append(models.DutyShift(
                hospital_id=hospital_id, house_officer_id=ho.id,
                shift_date=current_date, shift_type=models.ShiftTypeEnum.Morning,
                is_weekend=is_sunday, points_assigned=1.0
            ))
            points[ho.id] += 1.0
            morning_counts[ho.id] += 1
            last_shift_type[ho.id] = 'Morning'
            assigned_today.add(ho.id)

    db.add_all(shifts_to_create)
    db.commit()
    
    # Calculate balance metrics for logging
    total_points = sum(points.values())
    avg_points = total_points / len(hos) if hos else 0
    max_pts = max(points.values()) if hos else 0
    min_pts = min(points.values()) if hos else 0
    
    return {
        "message": "Schedule generated successfully", 
        "summary": {
            "total_shifts_created": len(shifts_to_create),
            "average_points": round(avg_points, 1),
            "max_points": round(max_pts, 1),
            "min_points": round(min_pts, 1),
        },
        "points_detail": points
    }
