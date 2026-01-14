import React from 'react';
import SearchBar from '../components/common/SearchBar';
import SelectFilter from '../components/common/SelectFilter';
import { statusOptions, fornecedorOptions, filialOptions } from './ordersConfig';

export default function OrdersFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  fornecedor,
  onFornecedorChange,
  filial,
  onFilialChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Buscar por número do pedido..."
      />
      <SelectFilter
        label="Status"
        name="status"
        value={statusFilter}
        onChange={onStatusChange}
        options={statusOptions}
      />
      <SelectFilter
        label="Fornecedor"
        name="fornecedor"
        value={fornecedor}
        onChange={onFornecedorChange}
        options={fornecedorOptions}
      />
      <SelectFilter
        label="Filial"
        name="filial"
        value={filial}
        onChange={onFilialChange}
        options={filialOptions}
      />
    </div>
  );
}