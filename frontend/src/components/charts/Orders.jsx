import React from "react";
import { FiLoader } from "react-icons/fi";

export default function Orders({ img, text, number, onClick, loading = false }) {
    return (
        <div className="border rounded-xl p-3 flex items-center justify-center gap-3 w-full min-w-0 flex-1 overflow-hidden cursor-pointer"  onClick={onClick}>
            {img ? (
                <img
                    src={img}
                    alt={text}
                    className="hidden 2xl:block 2xl:flex-shrink-0 2xl:object-contain 2xl:h-auto 2xl:max-w-[36%]"
                />
            ) : (
                <div className="hidden 2xl:block 2xl:flex-shrink-0 2xl:w-24 2xl:h-24 bg-gray-100 rounded-md" />
            )}
            <div className="flex flex-col items-center justify-center min-w-0 px-1">
                <p className="text-[#230B34] text-center break-words" style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.25rem)' }}>{text ?? "Item"}</p>
                {loading ? (
                    <FiLoader className="animate-spin text-[#230B34]" size={24} />
                ) : (
                    <p className="font-bold text-[#230B34]" style={{ fontSize: 'clamp(1.1rem, 2.4vw, 2rem)' }}>{number ?? 0}</p>
                )}
            </div>

        </div>
    );
}