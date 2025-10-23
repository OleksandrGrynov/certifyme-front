import { useParams } from "react-router-dom";

export default function CourseDetailsPage() {
    const { id } = useParams();

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Курс №{id}</h1>
            <p className="text-gray-700 mb-6">
                Детальний опис курсу. Тут будуть відеоуроки, інформація про викладача,
                відгуки та кнопка "Придбати курс".
            </p>

            <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
                Придбати курс
            </button>
        </div>
    );
}
