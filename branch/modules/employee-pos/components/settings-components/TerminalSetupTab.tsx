'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Laptop,
  CheckCircle2,
  XCircle,
  Key,
  Store,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Terminal } from './settingsTypes';

interface TerminalSetupTabProps {
  terminals: Terminal[];
  setTerminals: React.Dispatch<React.SetStateAction<Terminal[]>>;
}

export default function TerminalSetupTab({
  terminals,
  setTerminals,
}: TerminalSetupTabProps) {
  // Local States
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [isTerminalAddOpen, setIsTerminalAddOpen] = useState(false);
  const [isTerminalEditOpen, setIsTerminalEditOpen] = useState(false);
  const [terminalSearch, setTerminalSearch] = useState('');
  const [terminalPage, setTerminalPage] = useState(1);
  const [terminalLimit, setTerminalLimit] = useState(10);
  const [terminalForm, setTerminalForm] = useState({
    _id: '',
    realDevices: true,
    terminalName: '',
    terminalId: '',
    apiToken: '',
    storeId: '',
  });

  // Operations
  const filteredTerminals = useMemo(() => {
    return terminals.filter(
      (t) =>
        t.terminalName.toLowerCase().includes(terminalSearch.toLowerCase()) ||
        t.terminalId.toLowerCase().includes(terminalSearch.toLowerCase()) ||
        t.storeId.toLowerCase().includes(terminalSearch.toLowerCase())
    );
  }, [terminals, terminalSearch]);

  const paginatedTerminals = useMemo(() => {
    const start = (terminalPage - 1) * terminalLimit;
    return filteredTerminals.slice(start, start + terminalLimit);
  }, [filteredTerminals, terminalPage, terminalLimit]);

  const handleAddTerminal = (closeAfter = false) => {
    if (
      !terminalForm.terminalName ||
      !terminalForm.terminalId ||
      !terminalForm.apiToken ||
      !terminalForm.storeId
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    const newTerminal: Terminal = {
      _id: String(Date.now()),
      realDevices: terminalForm.realDevices ? 'Yes' : 'No',
      terminalName: terminalForm.terminalName,
      terminalId: terminalForm.terminalId,
      apiToken: terminalForm.apiToken,
      storeId: terminalForm.storeId,
      createdDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      updatedDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      createdBy: 'Manager',
    };
    setTerminals([newTerminal, ...terminals]);
    toast.success('Terminal added successfully!');
    setTerminalForm({
      _id: '',
      realDevices: true,
      terminalName: '',
      terminalId: '',
      apiToken: '',
      storeId: '',
    });
    if (closeAfter) setIsTerminalAddOpen(false);
  };

  const handleEditTerminalSave = () => {
    setTerminals(
      terminals.map((t) =>
        t._id === terminalForm._id
          ? {
              ...t,
              realDevices: terminalForm.realDevices ? 'Yes' : 'No',
              terminalName: terminalForm.terminalName,
              terminalId: terminalForm.terminalId,
              apiToken: terminalForm.apiToken,
              storeId: terminalForm.storeId,
              updatedDate: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
            }
          : t
      )
    );
    toast.success('Terminal updated successfully!');
    setIsTerminalEditOpen(false);
  };

  const executeDeleteTerminal = (id: string) => {
    setTerminals(terminals.filter((t) => t._id !== id));
    toast.success('Terminal deleted successfully!');
  };

  const handleDeleteTerminal = (id: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1 text-xs font-sans">
          <p className="font-bold text-neutral-900">
            Are you sure you want to remove this terminal?
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-2.5 py-1 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeDeleteTerminal(id);
              }}
              className="px-2.5 py-1 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: 'top-center' }
    );
  };

  const totalPages = Math.ceil(filteredTerminals.length / terminalLimit);

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-[17px] font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              POS Hardware & Counter Terminals
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Authorize billing counters, cashier tablets, and dedicated sync tokens.
            </p>
          </div>
        </div>

        {/* Add Terminal Action */}
        <button
          onClick={() => {
            setTerminalForm({
              _id: '',
              realDevices: true,
              terminalName: '',
              terminalId: '',
              apiToken: '',
              storeId: '',
            });
            setIsTerminalAddOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-[11px] font-800 uppercase tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 self-start sm:self-center"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add New Terminal</span>
        </button>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-[300px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={terminalSearch}
            onChange={(e) => {
              setTerminalSearch(e.target.value);
              setTerminalPage(1);
            }}
            placeholder="Search terminal name, ID, or store..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9.5 pr-8 py-2 text-[12px] text-neutral-700 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
          />
          {terminalSearch && (
            <button
              onClick={() => setTerminalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-bold self-end sm:self-auto">
          <span>Show:</span>
          <select
            value={terminalLimit}
            onChange={(e) => {
              setTerminalLimit(Number(e.target.value));
              setTerminalPage(1);
            }}
            className="border border-neutral-200 rounded-lg px-2 py-1 bg-neutral-50 text-neutral-700 font-mono text-[11px] focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      {/* ── Modern Table Card ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Terminal Name</th>
                <th className="px-5 py-3.5">Device Type</th>
                <th className="px-5 py-3.5">Terminal ID</th>
                <th className="px-5 py-3.5">API Token</th>
                <th className="px-5 py-3.5">Store ID</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {paginatedTerminals.length > 0 ? (
                paginatedTerminals.map((term) => (
                  <tr key={term._id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-neutral-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Monitor size={15} className="text-neutral-400" />
                        <span>{term.terminalName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {term.realDevices === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          Physical Device
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-medium">
                          Virtual / Web
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-neutral-800 text-[11px]">
                      {term.terminalId}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-neutral-400 text-[11px]">
                      {term.apiToken ? `${term.apiToken.slice(0, 10)}...` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-neutral-600 font-medium">
                      {term.storeId}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-neutral-400 text-[11px]">
                      {term.createdDate}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTerminal(term);
                            setIsTerminalModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setTerminalForm({
                              _id: term._id,
                              realDevices: term.realDevices === 'Yes',
                              terminalName: term.terminalName,
                              terminalId: term.terminalId,
                              apiToken: term.apiToken,
                              storeId: term.storeId,
                            });
                            setIsTerminalEditOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-primary flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Terminal"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTerminal(term._id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Terminal"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
                    <Laptop size={32} className="mx-auto text-neutral-300 mb-2" />
                    <p className="text-[13px] font-bold text-neutral-600">No POS terminals configured</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Click &ldquo;Add New Terminal&rdquo; to register counter hardware.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {filteredTerminals.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-500 font-medium">
            <span>
              Showing {Math.min((terminalPage - 1) * terminalLimit + 1, filteredTerminals.length)} to{' '}
              {Math.min(terminalPage * terminalLimit, filteredTerminals.length)} of{' '}
              {filteredTerminals.length} terminals
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={terminalPage <= 1}
                onClick={() => setTerminalPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2 text-xs font-bold text-neutral-700">
                {terminalPage} / {Math.max(1, totalPages)}
              </span>
              <button
                disabled={terminalPage >= totalPages}
                onClick={() => setTerminalPage((p) => p + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL A: Terminal Details View ── */}
      {isTerminalModalOpen && selectedTerminal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans border border-neutral-200">
            <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-brand-primary" />
                <h3 className="font-extrabold text-[13px] uppercase tracking-wider">
                  Terminal Specification
                </h3>
              </div>
              <button
                onClick={() => setIsTerminalModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Terminal Name
                  </span>
                  <span className="font-extrabold text-neutral-900 text-[13.5px] block mt-0.5">
                    {selectedTerminal.terminalName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Hardware Status
                  </span>
                  <span className="font-bold text-neutral-800 text-[12px] block mt-0.5">
                    {selectedTerminal.realDevices === 'Yes' ? 'Physical Terminal' : 'Virtual / Web'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Terminal Device ID
                </span>
                <span className="font-mono text-neutral-900 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 block mt-1 font-bold">
                  {selectedTerminal.terminalId}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  API Sync Token
                </span>
                <span className="font-mono text-neutral-700 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 block mt-1 break-all text-[11px]">
                  {selectedTerminal.apiToken}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Assigned Store ID
                </span>
                <span className="font-medium text-neutral-800 block mt-0.5">
                  {selectedTerminal.storeId}
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTerminal(null);
                  setIsTerminalModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL B: Add Terminal Modal ── */}
      {isTerminalAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans border border-neutral-200">
            <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-brand-primary" />
                <h3 className="font-extrabold text-[13px] uppercase tracking-wider">
                  Register New POS Terminal
                </h3>
              </div>
              <button
                onClick={() => setIsTerminalAddOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Terminal Name *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.terminalName}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, terminalName: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Counter POS 01"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Terminal ID *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.terminalId}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, terminalId: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. TH-01"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    API Token *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.apiToken}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, apiToken: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. tok_live_0987..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Store ID *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.storeId}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, storeId: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. branch_delhi"
                  />
                </div>

                <div className="sm:col-span-2 pt-1 flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">
                      Physical POS Hardware?
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Toggle on for desktop touchscreen counters or card machines.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={terminalForm.realDevices}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, realDevices: e.target.checked })
                    }
                    className="w-4 h-4 text-brand-primary rounded border-neutral-300 focus:ring-brand-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 px-5 py-3.5 border-t border-neutral-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTerminalAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddTerminal(true)}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Register Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL C: Edit Terminal Modal ── */}
      {isTerminalEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans border border-neutral-200">
            <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-brand-primary" />
                <h3 className="font-extrabold text-[13px] uppercase tracking-wider">
                  Update Terminal Setup
                </h3>
              </div>
              <button
                onClick={() => setIsTerminalEditOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Terminal Name *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.terminalName}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, terminalName: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Terminal ID *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.terminalId}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, terminalId: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    API Token *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.apiToken}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, apiToken: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Store ID *
                  </label>
                  <input
                    type="text"
                    value={terminalForm.storeId}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, storeId: e.target.value })
                    }
                    className="border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="sm:col-span-2 pt-1 flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">
                      Physical POS Hardware?
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Toggle on for desktop touchscreen counters or card machines.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={terminalForm.realDevices}
                    onChange={(e) =>
                      setTerminalForm({ ...terminalForm, realDevices: e.target.checked })
                    }
                    className="w-4 h-4 text-brand-primary rounded border-neutral-300 focus:ring-brand-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 px-5 py-3.5 border-t border-neutral-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTerminalEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditTerminalSave}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-orange-600 text-white text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
