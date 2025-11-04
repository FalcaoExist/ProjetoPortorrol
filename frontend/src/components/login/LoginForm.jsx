export default function LoginForm({logo, onSubmit, email, onEmailChange, password, onPasswordChange, errors}){
    return (
        <form action="" onSubmit={onSubmit}>
            <img src={logo} alt="logo" className="mt-8" />
            <div className="flex flex-col justify-center flex-wrap">
                <label htmlFor="email" className="text-center mb-2 font-poppins text-[#273240]">Insira seu email</label>
                <input type="email" name="email" id="email" className="h-8 border border-black mb-5 rounded-lg px-2 py-4" value={email} onChange={onEmailChange} />
                {errors?.email && <span className="text-red-600 text-sm text-center -mt-4 mb-2">{errors.email}</span>}
            </div>
            <div className="flex flex-col justify-center flex-wrap">
                <label htmlFor="password" className="text-center mb-2 font-poppins">Insira sua senha</label>
                <input type="password" name="password" id="password" className="h-8 border border-black rounded-lg px-2 py-4" value={password} onChange={onPasswordChange}/>
                {errors?.password && <span className="text-red-600 text-sm text-center mt-1">{errors.password}</span>}
            </div>
            <div className="flex justify-center mt-4">
                <button type="submit" className="bg-primary hover:bg-white active:bg-secondary border-2 boder-primary hover:border-black active:border-white active:boder-secondary p-1 w-32 rounded-xl text-lg text-white hover:text-black active:text-white font-poppins"> Entrar</button>
            </div>
        </form>
    )
}