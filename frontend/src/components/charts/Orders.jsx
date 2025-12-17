import React from "react";

export default function Orders({ img, text, number }) {
    return (
        <div className="border rounded-xl p-3 flex items-center gap-3 w-full min-w-0 flex-1">
            {img ? (
                <img
                    src={img}
                    alt={text}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                />
            ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gray-100 rounded-md" />
            )}
            <div className="flex flex-col items-center justify-center min-w-0">
                <p className="text-sm md:text-base text-gray-500">{text ?? "Item"}</p>
                <p className="text-xl md:text-2xl font-bold">{number ?? 0}</p>
            </div>

        </div>
    );
}