from fastapi import APIRouter, Depends, Request, Response
from app.core.security import create_access_token
from app.core.dependencies import get_auth_service, get_current_user, get_user_service
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.api.schemas import LoginRequest, LoginResponse, UserGetResponse, ChangePasswordRequest

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    response: Response,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    ip = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    result = auth_service.check_credentials(data.email, data.password, ip_address=ip)

    if not result:
        return {"success": False, "message": "Credenciais inválidas", "user": None}

    access_token = create_access_token(data={"sub": result["user_id"]})

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=18000,
        samesite="lax",
        secure=False,
    )

    return {"success": True, "user": result, "message": "Login realizado com sucesso"}

@router.get("/me", response_model=UserGetResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}

@router.put("/me/password")
def change_own_password(
    data: ChangePasswordRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    user_service.change_password(
        user_id=current_user["user_id"],
        current_password=data.current_password,
        new_password=data.new_password,
        performed_by=current_user["user_id"],
    )
    return {"success": True, "message": "Senha alterada com sucesso!"}