import React from "react";

export default function LateOrders({ img, number }) {
    return (
        <div className="border border-1 rounded-xl h-full col-span-2 p-4 flex items-center gap-3">
            {img ? (
                <img src={img} alt="Late orders" className="w-12 h-12 object-contain" />
            ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-md" />
            )}
            <div className="flex-col items-center">
                <p className="text-sm text-gray-500">Atrasados</p>
                <p className="text-2xl font-bold">{number ?? 0}</p>
            </div>

        </div>
    );
}