import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { InventoryItem } from '../../types';
import { formatCurrencyFromCents, parseToCents } from '../../utils/formatters';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulário Novo Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('armacao');
  const [brand, setBrand] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [minAlertQuantity, setMinAlertQuantity] = useState(3);
  const [costPriceStr, setCostPriceStr] = useState('90,00');
  const [sellingPriceStr, setSellingPriceStr] = useState('290,00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand) return;

    setSubmitting(true);
    try {
      const status: InventoryItem['status'] =
        quantity <= 0
          ? 'esgotado'
          : quantity <= minAlertQuantity
          ? 'baixo_estoque'
          : 'disponivel';

      const newItem = await inventoryService.create({
        name,
        category,
        brand,
        modelCode,
        quantity,
        minAlertQuantity,
        costPriceInCents: parseToCents(costPriceStr),
        sellingPriceInCents: parseToCents(sellingPriceStr),
        status,
      });

      setItems((prev) => [newItem, ...prev]);
      setModalOpen(false);
      setName('');
      setBrand('');
      setModelCode('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.brand.toLowerCase().includes(term) ||
      item.modelCode.toLowerCase().includes(term)
    );
  });

  const lowStockCount = items.filter((i) => i.status === 'baixo_estoque').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-teal-600" />
            <span>Estoque de Armações & Lentes</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Controle de óculos, insumos e lentes de contato do consultório
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Produto</span>
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atenção:</strong> Existem <strong>{lowStockCount} produtos</strong> com estoque abaixo da quantidade mínima.
            </span>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, marca ou código de referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Item / Modelo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Marca / Código</th>
                <th className="py-3 px-4">Estoque Atual</th>
                <th className="py-3 px-4">Preço Venda</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 capitalize">
                    {item.category === 'armacao'
                      ? 'Armação'
                      : item.category === 'lente_contato'
                      ? 'Lente de Contato'
                      : item.category === 'solucao_limpeza'
                      ? 'Solução de Limpeza'
                      : item.category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {item.brand} ({item.modelCode})
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {item.quantity} un.
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal-700">
                    {formatCurrencyFromCents(item.sellingPriceInCents)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'disponivel'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'baixo_estoque'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status === 'disponivel'
                        ? 'Disponível'
                        : item.status === 'baixo_estoque'
                        ? 'Baixo Estoque'
                        : 'Esgotado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Produto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Cadastrar Item no Estoque
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Armação Acetato Italiano Retrô"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="armacao">Armação</option>
                    <option value="lente_contato">Lente de Contato</option>
                    <option value="lente_oftalmica">Lente Oftálmica</option>
                    <option value="solucao_limpeza">Solução / Colírio</option>
                    <option value="acessorio">Acessório</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Coleção Consultório"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cód. Referência</label>
                  <input
                    type="text"
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                    placeholder="MOD-100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd. Inicial</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alerta Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={minAlertQuantity}
                    onChange={(e) => setMinAlertQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="text"
                    value={costPriceStr}
                    onChange={(e) => setCostPriceStr(e.target.value)}
                    placeholder="90,00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="text"
                    value={sellingPriceStr}
                    onChange={(e) => setSellingPriceStr(e.target.value)}
                    placeholder="290,00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-teal-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-medium text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50">
                  {submitting ? 'Salvando...' : 'Adicionar ao Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
