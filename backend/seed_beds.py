from app.database import SessionLocal
from app import models

def seed_beds():
    db = SessionLocal()
    try:
        hospitals = db.query(models.Hospital).all()
        if not hospitals:
            print("No hospital found.")
            return

        hospital = hospitals[0]
        
        # Check existing
        count = db.query(models.WardBed).filter(models.WardBed.hospital_id == hospital.id).count()
        if count > 0:
            print(f"Hospital already has {count} beds.")
            return

        beds_data = [
            # Male Surgical Ward
            ("Male Surgical Ward", models.WardTypeEnum.General, "101", 1500.0),
            ("Male Surgical Ward", models.WardTypeEnum.General, "102", 1500.0),
            ("Male Surgical Ward", models.WardTypeEnum.General, "103", 1500.0),
            ("Male Surgical Ward", models.WardTypeEnum.General, "104", 1500.0),
            ("Male Surgical Ward", models.WardTypeEnum.General, "105", 1500.0),

            # Female Surgical Ward
            ("Female Surgical Ward", models.WardTypeEnum.General, "201", 1500.0),
            ("Female Surgical Ward", models.WardTypeEnum.General, "202", 1500.0),
            ("Female Surgical Ward", models.WardTypeEnum.General, "203", 1500.0),
            ("Female Surgical Ward", models.WardTypeEnum.General, "204", 1500.0),

            # General Medical Ward
            ("General Medical Ward", models.WardTypeEnum.General, "301", 1200.0),
            ("General Medical Ward", models.WardTypeEnum.General, "302", 1200.0),
            ("General Medical Ward", models.WardTypeEnum.General, "303", 1200.0),
            ("General Medical Ward", models.WardTypeEnum.General, "304", 1200.0),
            ("General Medical Ward", models.WardTypeEnum.General, "305", 1200.0),

            # Pediatrics Ward
            ("Pediatrics Ward", models.WardTypeEnum.General, "401", 1000.0),
            ("Pediatrics Ward", models.WardTypeEnum.General, "402", 1000.0),
            ("Pediatrics Ward", models.WardTypeEnum.General, "403", 1000.0),

            # ICU Ward
            ("ICU Complex", models.WardTypeEnum.ICU, "ICU-01", 5000.0),
            ("ICU Complex", models.WardTypeEnum.ICU, "ICU-02", 5000.0),
            ("ICU Complex", models.WardTypeEnum.ICU, "ICU-03", 5000.0),
        ]

        for ward, wtype, bed_num, cost in beds_data:
            bed = models.WardBed(
                hospital_id=hospital.id,
                ward_name=ward,
                ward_type=wtype,
                bed_number=bed_num,
                cost_per_day=cost,
                is_occupied=False
            )
            db.add(bed)

        db.commit()
        print(f"Successfully seeded {len(beds_data)} hospital ward beds!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding beds: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_beds()
