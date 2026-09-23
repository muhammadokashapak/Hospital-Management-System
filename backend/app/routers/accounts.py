from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("/expenses")
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.LedgerExpense).filter(models.LedgerExpense.hospital_id == current_user.hospital_id).all()

@router.post("/expenses")
def add_expense(category: str, title: str, amount: float, vendor_name: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    exp = models.LedgerExpense(
        hospital_id=current_user.hospital_id,
        category=category,
        title=title,
        amount=amount,
        vendor_name=vendor_name
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.get("/summary")
def get_financial_summary(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    invoices = db.query(models.Invoice).filter(models.Invoice.hospital_id == current_user.hospital_id, models.Invoice.status == models.InvoiceStatusEnum.Paid).all()
    expenses = db.query(models.LedgerExpense).filter(models.LedgerExpense.hospital_id == current_user.hospital_id).all()
    
    total_income = sum(i.amount for i in invoices)
    total_expenses = sum(e.amount for e in expenses)
    net_profit = total_income - total_expenses
    
    return {"total_income": total_income, "total_expenses": total_expenses, "net_profit": net_profit}
