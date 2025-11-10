import bcrypt
senha = "123456"
hashed = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
print(hashed)
