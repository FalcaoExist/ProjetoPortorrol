from fastapi import APIRouter, Depends, Request, Response
from app.core.security import create_access_token
from app.core.dependencies import get_auth_service, get_current_user, get_user_service
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.api.schemas import LoginRequest, LoginResponse, UserGetResponse, ChangePasswordRequest, SimpleMessageResponse

router = APIRouter(tags=["Auth"])

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Autenticar usuário",
    description="Valida credenciais e define cookie HTTP-only com token de acesso.",
    responses={
        200: {
            "description": "Login processado",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "user": {
                            "user_id": "00000000-0000-4000-8000-000000000100",
                            "name": "Usuário Demo",
                            "email": "user@example.test",
                            "role": "gestor",
                            "supplier": ["SUPPLIER_DEMO_A"],
                            "is_active": True,
                        },
                        "message": "Login realizado com sucesso",
                    }
                }
            },
        },
        401: {"description": "Credenciais inválidas"},
        422: {"description": "Payload inválido"},
    },
)
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

@router.get(
    "/me",
    response_model=UserGetResponse,
    summary="Obter usuário autenticado",
    description="Retorna os dados do usuário atual a partir do token presente em cookie.",
    responses={
        200: {
            "description": "Perfil retornado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "user": {
                            "user_id": "00000000-0000-4000-8000-000000000100",
                            "name": "Usuário Demo",
                            "email": "user@example.test",
                            "role": "gestor",
                            "supplier": ["SUPPLIER_DEMO_A"],
                            "is_active": True,
                        },
                    }
                }
            },
        },
        401: {"description": "Não autenticado"},
    },
)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}

@router.put(
    "/me/password",
    response_model=SimpleMessageResponse,
    summary="Alterar senha do usuário autenticado",
    description="Altera a senha do próprio usuário mediante validação da senha atual.",
    responses={
        200: {
            "description": "Senha alterada",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Senha alterada com sucesso!",
                    }
                }
            },
        },
        400: {"description": "Senha atual inválida"},
        401: {"description": "Não autenticado"},
        422: {"description": "Payload inválido"},
    },
)
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
