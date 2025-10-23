export default function RegisterPage() {
    return (
        <div className="max-w-md mx-auto bg-white shadow-md p-8 rounded-lg">
            <h1 className="text-2xl font-bold text-center mb-6">Реєстрація</h1>

            <form className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Ім’я"
                    className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    className="border border-gray-300 rounded px-3 py-2"
                />
                <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Зареєструватись
                </button>
            </form>

            <p className="text-center text-sm mt-4">
                Вже маєш акаунт?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                    Увійти
                </a>
            </p>
        </div>
    );
}
