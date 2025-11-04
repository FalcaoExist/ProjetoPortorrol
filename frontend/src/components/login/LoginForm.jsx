export default function LoginForm({logo, onSubmit, email, onEmailChange, password, onPasswordChange, errors}){
    return (
        <form action="" onSubmit={onSubmit} className="flex flex-col items-center justify-center w-full h-full">
            <img src={logo} alt="logo" className="mb-4 " />
            <div className="flex flex-col justify-center w-full mb-4 sm:mb-5 md:mb-6 px-4 sm:px-0">
                <label htmlFor="email" className="text-center mb-2 sm:mb-3 font-poppins text-[#273240] text-sm sm:text-base md:text-lg lg:text-xl">Insira seu email</label>
                <input type="email" name="email" id="email" className="h-9 sm:h-10 md:h-12 border-2 border-black mb-2 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-poppins focus:outline-none focus:border-primary" value={email} onChange={onEmailChange} />
                {errors?.email && <span className="text-red-600 text-xs sm:text-sm text-center mb-3 sm:mb-4">{errors.email}</span>}
            </div>
            <div className="flex flex-col justify-center w-full mb-6 sm:mb-7 md:mb-8 px-4 sm:px-0">
                <label htmlFor="password" className="text-center mb-2 sm:mb-3 font-poppins text-sm sm:text-base md:text-lg lg:text-xl text-[#273240]">Insira sua senha</label>
                <input type="password" name="password" id="password" className="h-9 sm:h-10 md:h-12 border-2 border-black rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-poppins focus:outline-none focus:border-primary" value={password} onChange={onPasswordChange}/>
                {errors?.password && <span className="text-red-600 text-xs sm:text-sm text-center mt-2">{errors.password}</span>}
            </div>
            <div className="flex justify-center w-full px-4 sm:px-0">
                <button type="submit" className="bg-primary hover:bg-white active:bg-secondary border-2 border-primary hover:border-black active:border-white active:border-secondary px-6 sm:px-7 md:px-8 py-2 sm:py-2.5 md:py-3 w-32 sm:w-40 md:w-48 lg:w-56 rounded-xl text-sm sm:text-base md:text-lg lg:text-xl text-white hover:text-black active:text-white font-poppins  transition-all">Entrar</button>
            </div>
        </form>
    )
}