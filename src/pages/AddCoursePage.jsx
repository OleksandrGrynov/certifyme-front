export default function AddCoursePage() {
    return (
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-6">Додати новий курс</h1>

            <form className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Назва курсу"
                    className="border border-gray-300 rounded px-3 py-2"
                />
                <textarea
                    placeholder="Опис курсу"
                    className="border border-gray-300 rounded px-3 py-2 h-24 resize-none"
                ></textarea>

                <select className="border border-gray-300 rounded px-3 py-2">
                    <option>Категорія</option>
                    <option>Програмування</option>
                    <option>Дизайн</option>
                    <option>Менеджмент</option>
                </select>

                <input
                    type="number"
                    placeholder="Ціна (₴)"
                    className="border border-gray-300 rounded px-3 py-2"
                />

                <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                    Зберегти курс
                </button>
            </form>
        </div>
    );
}
