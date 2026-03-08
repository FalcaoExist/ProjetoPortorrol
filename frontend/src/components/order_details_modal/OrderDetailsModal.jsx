import { Modal, Box } from "@mui/material";
import OrdersTable from "../orders_table/OrdersTable";
import { modalStyle } from "../../pages/ordersConfig";

export default function OrderDetailsModal({ open, onClose, items, updateData }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="order-details-modal-title"
            aria-describedby="order-details-modal-description"
        >
            <Box sx={modalStyle}>
                <h2 id="order-details-modal-title" className="mb-4 text-xl font-semibold">
                    Itens do Pedido: {items[0]?.numero_pedido}
                </h2>
                <OrdersTable rows={items} updateData={updateData} />
            </Box>
        </Modal>
    );
}
