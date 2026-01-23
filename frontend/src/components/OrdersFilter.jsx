import React from 'react';
import SearchBar from './common/SearchBar';
import SelectFilter from './common/SelectFilter';
import DateFilter from './common/DateFilter';
import { statusOptions } from '../pages/ordersConfig';

export default function OrdersFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  orderDate,
  onOrderDateChange,
  responsavelFilter,
  onResponsavelChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Buscar por número do pedido..."
      />
      <SearchBar
        value={responsavelFilter}
        onChange={onResponsavelChange}
        placeholder="Buscar por responsável..."
      />
      <SelectFilter
        label="Status"
        name="status"
        value={statusFilter}
        onChange={onStatusChange}
        options={statusOptions}
      />
      <DateFilter
        label="Data do pedido"
        name="orderDate"
        value={orderDate}
        onChange={onOrderDateChange}
      />
    </div>
  );
}
