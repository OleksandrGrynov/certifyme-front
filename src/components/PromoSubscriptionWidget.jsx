import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Send } from "lucide-react";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import toast from "react-hot-toast";
import "./PromoWidget.css";

export default function PromoSubscriptionWidget() {
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [neverShow, setNeverShow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 40, y: 250 });

  const offset = useRef({ x: 0, y: 0 });
  const showTimeout = useRef(null);
  const interval = useRef(null);
  const inactivityTimer = useRef(null);

  /* ======================================================
     🧩 1. Перевірка токену і статусу підписки
     ====================================================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const keyBase = `promoWidget_${token.slice(0, 16)}`;
    const subscribed = localStorage.getItem(`${keyBase}_subscribed`);
    const dismissed = localStorage.getItem(`${keyBase}_neverShow`);

    if (dismissed === "true" || subscribed === "true") return;

    fetch("http://localhost:5000/api/sms/check", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.subscribed) {
          localStorage.setItem(`${keyBase}_subscribed`, "true");
        } else {
          showTimeout.current = setTimeout(() => setVisible(true), 2000);
          interval.current = setInterval(() => {
            const againDismissed = localStorage.getItem(`${keyBase}_neverShow`);
            const againSub = localStorage.getItem(`${keyBase}_subscribed`);
            if (!againDismissed && !againSub) setVisible(true);
          }, 7 * 60 * 1000);
        }
      })
      .catch((err) => console.warn("⚠️ SMS check failed:", err));

    return () => {
      clearTimeout(showTimeout.current);
      clearInterval(interval.current);
    };
  }, []);

  /* ======================================================
     ⏱️ 2. Автоматичне приховування після 10 секунд без дій
     ====================================================== */
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (visible) {
        setVisible(false);
        toast("💤 Вікно приховано через неактивність", {
          duration: 3000,
          style: {
            background: "#111827",
            border: "1px solid #22c55e",
            borderRadius: "12px",
            color: "#f9fafb",
          },
        });
      }
    }, 10000); // 10 секунд
  };

  useEffect(() => {
    if (!visible) return;
    resetInactivityTimer();
    const events = ["mousemove", "keydown", "click", "scroll"];
    const resetAll = () => resetInactivityTimer();
    events.forEach((ev) => window.addEventListener(ev, resetAll));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetAll));
      clearTimeout(inactivityTimer.current);
    };
  }, [visible]);

  /* ======================================================
     🖱️ 3. Перетягування (draggable)
     ====================================================== */
  const handleMouseDown = (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  /* ======================================================
     📲 4. Підписка на SMS
     ====================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error("📱 Введіть номер телефону!");

    const token = localStorage.getItem("token");
    if (!token) return toast.error("❌ Спочатку увійди в акаунт!");
    const keyBase = `promoWidget_${token.slice(0, 16)}`;

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/sms/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`${keyBase}_subscribed`, "true");
        setVisible(false);
        toast.success("✅ Ви підписались на SMS-сповіщення!");
      } else toast.error("⚠️ " + (data.message || "Помилка підписки"));
    } catch {
      toast.error("⚠️ Сервер недоступний");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================================================
     ❌ 5. Закриття вікна з підтвердженням
     ====================================================== */
  const handleCloseClick = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-100">
            Ви впевнені, що хочете закрити це вікно?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Ні
            </button>
            <button
              onClick={() => {
                setVisible(false);
                toast.dismiss(t.id);
                toast.success("🔕 Вікно закрито. Воно може з’явитися знову пізніше.");
              }}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Так, закрити
            </button>
          </div>
        </div>
      ),
      {
        duration: 7000,
        style: {
          background: "#111827",
          border: "1px solid #22c55e",
          borderRadius: "12px",
          color: "#f9fafb",
        },
      }
    );
  };

  /* ======================================================
     🚫 6. Галочка "Більше не показувати"
     ====================================================== */
  const handleNeverShow = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const keyBase = `promoWidget_${token.slice(0, 16)}`;

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-100">
            Ви впевнені, що не хочете бачити цю пропозицію більше?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setNeverShow(false);
              }}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Ні
            </button>
            <button
              onClick={() => {
                localStorage.setItem(`${keyBase}_neverShow`, "true");
                setNeverShow(true);
                setVisible(false);
                toast.dismiss(t.id);
                toast.success("🚫 Сповіщення більше не показуватимуться");
              }}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Так, не показувати
            </button>
          </div>
        </div>
      ),
      {
        duration: 7000,
        style: {
          background: "#111827",
          border: "1px solid #22c55e",
          borderRadius: "12px",
          color: "#f9fafb",
        },
      }
    );
  };

  /* ======================================================
     🎨 7. Рендер компонента
     ====================================================== */
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 60 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 60 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            zIndex: 9999,
            width: 320,
            background: "rgba(17, 24, 39, 0.96)",
            border: "1px solid #22c55e",
            borderRadius: "18px",
            padding: "18px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-green-400 font-semibold text-lg flex items-center gap-2">
              <Phone size={18} /> SMS-сповіщення
            </h3>
            <button onClick={handleCloseClick}>
              <X size={18} className="text-gray-400 hover:text-red-400 transition" />
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-3 leading-snug">
            Підпишись, щоб не пропустити знижки та новини! 💚
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <PhoneInput
              country={"ua"}
              value={phone}
              onChange={setPhone}
              inputClass="phone-input-dark"
              dropdownClass="phone-dropdown-dark"
              inputStyle={{
                backgroundColor: "#111827",
                borderColor: "#22c55e",
                color: "white",
                borderRadius: "10px",
                width: "100%",
                fontSize: "15px",
              }}
            />

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md transition"
            >
              <Send size={16} />
              {submitting ? "Надсилання..." : "Підписатись"}
            </motion.button>
          </form>

          <label className="flex items-center gap-2 text-sm text-gray-400 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neverShow}
              onChange={(e) => {
                const checked = e.target.checked;
                setNeverShow(checked);
                if (checked) handleNeverShow();
              }}
            />
            Більше не показувати
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
