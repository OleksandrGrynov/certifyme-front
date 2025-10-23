import { motion } from "framer-motion";
import { useRef } from "react";
import Tilt from "react-parallax-tilt";

export default function ProfileCard({
                                        name = "Олександр Кравчук",
                                        title = "Розробник системи CertifyMe",
                                        handle = "@certifyme",
                                        status = "Online",
                                        contactText = "Написати",
                                        avatarUrl = "https://avatars.githubusercontent.com/u/1?v=4",
                                        showUserInfo = true,
                                        enableTilt = true,
                                        enableMobileTilt = false,
                                        onContactClick = () => alert("contact clicked"),
                                    }) {
    const cardRef = useRef(null);

    const CardContent = (
        <motion.div
            ref={cardRef}
            className="bg-[#0d0f12] border border-gray-800 rounded-2xl p-6 shadow-[0_0_40px_rgba(34,197,94,0.2)] flex flex-col items-center text-center text-gray-200 w-full max-w-sm transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.3)]"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
        >
            <div className="relative">
                <img
                    src={avatarUrl}
                    alt={name}
                    className="rounded-full w-40 h-40 object-cover border-4 border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                />
                <span className="absolute bottom-2 right-3 bg-green-500 w-4 h-4 rounded-full border-2 border-[#0d0f12]"></span>
            </div>

            {showUserInfo && (
                <>
                    <h3 className="mt-5 text-lg font-semibold text-white">{name}</h3>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className="text-sm text-green-400 mt-1">{handle}</p>
                    <p className="text-xs mt-1 text-gray-500">{status}</p>

                    <button
                        onClick={onContactClick}
                        className="mt-5 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300"
                    >
                        {contactText}
                    </button>
                </>
            )}
        </motion.div>
    );

    if (enableTilt && (!/Mobi|Android/i.test(navigator.userAgent) || enableMobileTilt)) {
        return (
            <Tilt
                glareEnable={true}
                glareMaxOpacity={0.3}
                scale={1.02}
                transitionSpeed={1500}
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                className="flex justify-center"
            >
                {CardContent}
            </Tilt>
        );
    }

    return <div className="flex justify-center">{CardContent}</div>;
}
