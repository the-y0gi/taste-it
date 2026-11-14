"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Store,
  Plus,
  MapPin,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Radio,
  AlertCircle,
  Power,
  Copy,
  Check,
  Utensils,
  Coffee,
  Sandwich,
  ChefHat,
  Sparkles,
  FileText,
  Lock,
  Tag,
  X,
  ShoppingBag,
  TrendingUp,
  Truck,
  FileCheck,
  Wallet,
  Clock,
  BarChart3,
  Users,
  TableProperties,
  RotateCcw,
} from "lucide-react";

interface FeatureToggles {
  pos: boolean;
  kds: boolean;
  kotKitchen?: boolean;
  reception: boolean;
  receptionView?: boolean;
  delivery: boolean;
  deliveryFleet?: boolean;
  tableManagement: boolean;
  accountClosing: boolean;
  expenses: boolean;
  attendance: boolean;
  employeeAttendance?: boolean;
  reports: boolean;
  customers: boolean;
}

const getPresetFeatureToggles = (format: string): FeatureToggles => {
  switch (format) {
    case "qsr":
      return {
        pos: true,
        kds: true,
        kotKitchen: true,
        reception: true,
        receptionView: true,
        delivery: false,
        deliveryFleet: false,
        tableManagement: false,
        accountClosing: true,
        expenses: true,
        attendance: true,
        employeeAttendance: true,
        reports: true,
        customers: true,
      };
    case "cloud_kitchen":
      return {
        pos: true,
        kds: true,
        kotKitchen: true,
        reception: false,
        receptionView: false,
        delivery: true,
        deliveryFleet: true,
        tableManagement: false,
        accountClosing: true,
        expenses: true,
        attendance: true,
        employeeAttendance: true,
        reports: true,
        customers: true,
      };
    case "cafe":
      return {
        pos: true,
        kds: false,
        kotKitchen: false,
        reception: false,
        receptionView: false,
        delivery: false,
        deliveryFleet: false,
        tableManagement: false,
        accountClosing: true,
        expenses: true,
        attendance: true,
        employeeAttendance: true,
        reports: true,
        customers: true,
      };
    case "fine_dine":
      return {
        pos: true,
        kds: true,
        kotKitchen: true,
        reception: false,
        receptionView: false,
        delivery: false,
        deliveryFleet: false,
        tableManagement: true,
        accountClosing: true,
        expenses: true,
        attendance: true,
        employeeAttendance: true,
        reports: true,
        customers: true,
      };
    default:
      return {
        pos: true,
        kds: true,
        kotKitchen: true,
        reception: false,
        receptionView: false,
        delivery: false,
        deliveryFleet: false,
        tableManagement: false,
        accountClosing: true,
        expenses: true,
        attendance: true,
        employeeAttendance: true,
        reports: true,
        customers: true,
      };
  }
};

interface Branch {
  _id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  password?: string;
  restaurantType?: "general" | "qsr" | "cafe" | "cloud_kitchen" | "fine_dine";
  gstNumber?: string;
  featureToggles?: FeatureToggles;
  settings?: {
    mainSettings?: {
      gstNumber?: string;
      timezone?: string;
    };
  };
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  isLive: boolean;
  isLocationConfigured?: boolean;
  createdAt: string;
}

// Indian Restaurant Formats
const RESTAURANT_TYPES = [
  { id: "general", label: "Multi-Cuisine", icon: Utensils, desc: "Standard restaurant with multi-station kitchen" },
  { id: "qsr", label: "Fast Food / QSR", icon: Sandwich, desc: "Quick-service counter with burger/pizza/rolls" },
  { id: "cafe", label: "Café & Beverages", icon: Coffee, desc: "Coffee, shakes, bakery & snacks format" },
  { id: "cloud_kitchen", label: "Cloud Kitchen", icon: ChefHat, desc: "Delivery & takeaway focused ghost kitchen" },
  { id: "fine_dine", label: "Fine Dine", icon: Sparkles, desc: "Full service dine-in with table management" },
] as const;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    restaurantType: "general" | "qsr" | "cafe" | "cloud_kitchen" | "fine_dine";
    address: string;
    city: string;
    phone: string;
    email: string;
    password: string;
    gstNumber: string;
    featureToggles: FeatureToggles;
    isActive: boolean;
  }>({
    name: "",
    code: "",
    restaurantType: "general",
    address: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    gstNumber: "",
    featureToggles: getPresetFeatureToggles("general"),
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const getAuthConfig = () => {
    if (typeof window === "undefined") return { withCredentials: true };
    const token = localStorage.getItem("rms_superadmin_token");
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    };
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/branches`, getAuthConfig());
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (branch) {
      setEditingBranch(branch);
      const bT = branch.featureToggles || ({} as any);
      setFormData({
        name: branch.name,
        code: branch.code,
        restaurantType: (branch.restaurantType as any) || "general",
        address: branch.address || "",
        city: branch.city || "",
        phone: branch.phone || "",
        email: branch.email,
        password: branch.password || "",
        gstNumber: branch.gstNumber || branch.settings?.mainSettings?.gstNumber || "",
        featureToggles: {
          pos: bT.pos ?? true,
          kds: bT.kds ?? bT.kotKitchen ?? true,
          kotKitchen: bT.kds ?? bT.kotKitchen ?? true,
          reception: bT.reception ?? bT.receptionView ?? false,
          receptionView: bT.reception ?? bT.receptionView ?? false,
          delivery: bT.delivery ?? bT.deliveryFleet ?? false,
          deliveryFleet: bT.delivery ?? bT.deliveryFleet ?? false,
          tableManagement: bT.tableManagement ?? false,
          accountClosing: bT.accountClosing ?? true,
          expenses: bT.expenses ?? true,
          attendance: bT.attendance ?? bT.employeeAttendance ?? true,
          employeeAttendance: bT.attendance ?? bT.employeeAttendance ?? true,
          reports: bT.reports ?? true,
          customers: bT.customers ?? true,
        },
        isActive: branch.isActive,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: "",
        code: "",
        restaurantType: "general",
        address: "",
        city: "",
        phone: "",
        email: "",
        password: "",
        gstNumber: "",
        featureToggles: getPresetFeatureToggles("general"),
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        email: formData.email.toLowerCase().trim(),
      };

      if (editingBranch) {
        const res = await axios.patch(
          `${API_URL}/branches/${editingBranch._id}`,
          payload,
          getAuthConfig()
        );
        if (res.data.success) {
          setSuccessMsg("Branch updated successfully!");
          fetchBranches();
          setTimeout(() => setIsModalOpen(false), 900);
        }
      } else {
        const res = await axios.post(`${API_URL}/branches`, payload, getAuthConfig());
        if (res.data.success) {
          setSuccessMsg("New restaurant branch created successfully!");
          fetchBranches();
          setTimeout(() => setIsModalOpen(false), 900);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save branch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const newActiveState = !branch.isActive;
      const payload: { isActive: boolean; isLive?: boolean } = {
        isActive: newActiveState,
      };
      if (!newActiveState) {
        payload.isLive = false;
      }
      const res = await axios.patch(
        `${API_URL}/branches/${branch._id}`,
        payload,
        getAuthConfig()
      );
      if (res.data.success) {
        fetchBranches();
        toast.success(`Branch is now ${newActiveState ? "Active" : "Inactive"}`);
      }
    } catch (err: any) {
      toast.error("Failed to update branch active status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleLive = async (branch: Branch) => {
    if (!branch.isActive) {
      toast.error("Cannot Go Live! This branch is currently Inactive. Please activate the branch first.");
      return;
    }

    const isLocationSet =
      branch.isLocationConfigured ||
      (branch.lat !== null &&
        branch.lng !== null &&
        branch.lat !== undefined &&
        branch.lng !== undefined &&
        !(branch.lat === 0 && branch.lng === 0));

    if (!branch.isLive && !isLocationSet) {
      toast.error(
        "Cannot Go Live! The restaurant's exact GPS location coordinates (Latitude & Longitude) must be set in POS Settings first."
      );
      return;
    }

    try {
      const newLiveState = !branch.isLive;
      const res = await axios.patch(
        `${API_URL}/branches/${branch._id}`,
        { isLive: newLiveState },
        getAuthConfig()
      );
      if (res.data.success) {
        fetchBranches();
        toast.success(`Branch is now ${newLiveState ? "LIVE" : "OFFLINE"}`);
      }
    } catch (err: any) {
      toast.error("Failed to change live status: " + (err.response?.data?.message || err.message));
    }
  };

  const executeDeleteBranch = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/branches/${id}`, getAuthConfig());
      toast.success("Branch deleted successfully");
      fetchBranches();
    } catch (err: any) {
      toast.error("Failed to delete branch: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (id: string, name: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-xs">
        <p className="font-700 text-neutral-900">
          Are you sure you want to delete branch <b>&quot;{name}&quot;</b>?
        </p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 font-600 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDeleteBranch(id);
            }}
            className="px-2.5 py-1 font-700 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 5000, position: "top-center" });
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-brand-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-lg font-900 text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Restaurant Branch Management</span>
              <span className="text-[10px] font-800 bg-orange-100 text-brand-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Multi-Store RMS
              </span>
            </h1>
            <p className="text-xs text-neutral-500 font-500 mt-0.5">
              Create and manage branch outlets, credentials, kitchen station setups, and public Go-Live controls
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-800 rounded-xl transition-all shadow-md shadow-brand-primary/20 cursor-pointer active:scale-95 uppercase tracking-wider shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Create New Branch</span>
        </button>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search branches by name, code, city, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-white border border-neutral-200 rounded-xl pl-9 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-primary shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
          <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg border border-neutral-200">
            Total Branches: <strong>{branches.length}</strong>
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
            Active: <strong>{branches.filter((b) => b.isActive).length}</strong>
          </span>
          <span className="bg-orange-50 text-brand-primary px-2.5 py-1 rounded-lg border border-orange-200">
            Live: <strong>{branches.filter((b) => b.isActive && b.isLive).length}</strong>
          </span>
        </div>
      </div>

      {/* ── Branches Grid ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-xs text-neutral-400">
          Loading branch outlets...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
          <Building2 size={40} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="text-sm font-800 text-neutral-800">No Branches Found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No branches matching your search filter."
              : "You haven't created any restaurant branches yet. Click 'Create New Branch' to add your first branch."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => {
            const isLocationSet =
              branch.isLocationConfigured ||
              (branch.lat !== null &&
                branch.lng !== null &&
                branch.lat !== undefined &&
                branch.lng !== undefined &&
                !(branch.lat === 0 && branch.lng === 0));

            const typeObj =
              RESTAURANT_TYPES.find((t) => t.id === branch.restaurantType) || RESTAURANT_TYPES[0];
            const TypeIcon = typeObj.icon;

            return (
              <div
                key={branch._id}
                className={`bg-white rounded-2xl border ${
                  branch.isLive
                    ? "border-emerald-300 shadow-sm"
                    : branch.isActive
                    ? "border-neutral-200 shadow-xs"
                    : "border-red-200 bg-red-50/15"
                } p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:border-neutral-300`}
              >
                <div>
                  {/* Top Bar: Code, Format, Active, Live */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Branch Code */}
                        <span className="px-2 py-0.5 bg-orange-100 text-brand-primary font-mono font-900 text-[10.5px] rounded-md tracking-wider">
                          {branch.code}
                        </span>

                        {/* Outlet Format */}
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <TypeIcon size={10} className="text-neutral-500" />
                          <span>{typeObj.label}</span>
                        </span>

                        {/* Active Toggle Button */}
                        <button
                          onClick={() => handleToggleActive(branch)}
                          className={`inline-flex items-center gap-1 text-[10px] font-800 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                            branch.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          }`}
                          title="Click to toggle Active/Inactive"
                        >
                          <Power size={9} />
                          <span>{branch.isActive ? "Active" : "Inactive"}</span>
                        </button>

                        {/* Live Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[9.5px] font-800 px-2 py-0.5 rounded-full ${
                            branch.isActive && branch.isLive
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                          }`}
                        >
                          <Radio size={9} className={branch.isActive && branch.isLive ? "animate-pulse" : ""} />
                          <span>{branch.isActive && branch.isLive ? "LIVE" : "Offline"}</span>
                        </span>
                      </div>

                      <h2 className="text-base font-900 text-neutral-900 mt-2.5 tracking-tight">
                        {branch.name}
                      </h2>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(branch)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-brand-primary hover:bg-orange-50 transition-all cursor-pointer"
                        title="Edit Branch"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(branch._id, branch.name)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete Branch"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Branch Contact Details */}
                  <div className="py-3.5 space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-neutral-400 shrink-0" />
                      <span className="font-bold text-neutral-800 truncate">{branch.email}</span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-neutral-400 shrink-0" />
                        <span className="font-medium text-neutral-700">{branch.phone}</span>
                      </div>
                    )}

                    {branch.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-neutral-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {branch.address}
                          {branch.city ? `, ${branch.city}` : ""}
                        </span>
                      </div>
                    )}

                    {/* GSTIN Badge if set */}
                    {(branch.gstNumber || branch.settings?.mainSettings?.gstNumber) && (
                      <div className="flex items-center gap-2 text-[10.5px] font-bold text-neutral-700 pt-0.5">
                        <FileText size={12} className="text-neutral-400 shrink-0" />
                        <span>GSTIN: {branch.gstNumber || branch.settings?.mainSettings?.gstNumber}</span>
                      </div>
                    )}

                    {/* Location Status Indicator */}
                    <div className="pt-1.5">
                      {isLocationSet ? (
                        <div className="flex items-center gap-2 text-[10.5px] font-bold text-emerald-700 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>GPS Location Active ({branch.lat?.toFixed(3)}, {branch.lng?.toFixed(3)})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10.5px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                          <AlertCircle size={13} className="text-amber-600 shrink-0" />
                          <span>Location Pending (Capture GPS in POS Settings)</span>
                        </div>
                      )}
                    </div>

                    {/* Active Modules Badges */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] font-extrabold uppercase text-neutral-400">Modules:</span>
                      {(() => {
                        const bT = branch.featureToggles || ({} as any);
                        const activeList: string[] = [];
                        if (bT.pos !== false) activeList.push("POS");
                        if (bT.kds !== false && bT.kotKitchen !== false) activeList.push("KOT");
                        if (bT.reception === true || bT.receptionView === true) activeList.push("Queue");
                        if (bT.delivery === true || bT.deliveryFleet === true) activeList.push("Fleet");
                        if (bT.accountClosing !== false) activeList.push("EOD");
                        if (bT.expenses !== false) activeList.push("Expenses");
                        if (bT.attendance !== false && bT.employeeAttendance !== false) activeList.push("Staff");
                        if (bT.reports !== false) activeList.push("Reports");
                        if (bT.customers !== false) activeList.push("CRM");
                        return activeList.map((m) => (
                          <span key={m} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/70">
                            {m}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer Controls / Go Live Button */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400 font-bold">
                    Created:{" "}
                    {new Date(branch.createdAt).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <button
                    onClick={() => handleToggleLive(branch)}
                    disabled={!branch.isActive || (!branch.isLive && !isLocationSet)}
                    title={
                      !branch.isActive
                        ? "Activate branch first to Go Live"
                        : !isLocationSet
                        ? "Restaurant GPS coordinates must be configured in POS settings first"
                        : ""
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-800 transition-all flex items-center gap-1.5 shadow-2xs ${
                      !branch.isActive
                        ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60"
                        : branch.isLive
                        ? "bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer"
                        : isLocationSet
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer"
                        : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Radio size={12} />
                    <span>
                      {!branch.isActive
                        ? "Offline (Inactive)"
                        : branch.isLive
                        ? "Take Offline"
                        : "Go Live"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT BRANCH MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-brand-primary flex items-center justify-center shrink-0">
                  <Store size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-800 text-neutral-900 uppercase tracking-wide">
                    {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create New Restaurant Branch"}
                  </h2>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    Configure outlet format, POS login credentials, and features
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Branch MongoDB ID (Read-only for copying in Edit Mode) */}
              {editingBranch && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    Branch ID (System Ref)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={editingBranch._id}
                      className="w-full h-10 bg-neutral-100 border border-neutral-200 rounded-xl pl-3 pr-24 text-xs font-mono font-bold text-neutral-600 cursor-default focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingBranch._id);
                        setCopiedId(true);
                        toast.success("Branch ID copied to clipboard!");
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="absolute right-1.5 px-2.5 py-1 bg-white border border-neutral-200 hover:bg-neutral-50 text-[10.5px] font-bold text-neutral-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      {copiedId ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-neutral-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── 1. BRANCH NAME & CODE ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Taste-It Connaught Place"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    Branch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full h-10 bg-[#FAFAF9] border border-neutral-200 rounded-xl px-3 text-xs font-mono font-extrabold uppercase text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* ── 2. OUTLET FORMAT / RESTAURANT TYPE ── */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                  Outlet Format *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {RESTAURANT_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = formData.restaurantType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          const nextType = type.id as any;
                          const shouldApplyPreset = !editingBranch;
                          setFormData((prev) => ({
                            ...prev,
                            restaurantType: nextType,
                            featureToggles: shouldApplyPreset
                              ? getPresetFeatureToggles(nextType)
                              : prev.featureToggles,
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "bg-orange-50 border-brand-primary text-brand-primary font-bold shadow-2xs"
                            : "bg-[#FAFAF9] border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-brand-primary text-white" : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          <TypeIcon size={12} />
                        </div>
                        <span className="text-[11px] font-bold truncate">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. LOGIN CREDENTIALS ── */}
              <div className="p-4 bg-orange-50/40 border border-orange-200/80 rounded-2xl space-y-3">
                <span className="text-[10.5px] font-900 uppercase tracking-wider text-brand-primary block">
                  Branch POS Login Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-800 text-neutral-700 uppercase tracking-wider">
                      Login Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. cp@tasteit.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-10 pl-8 pr-3 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary"
                      />
                      <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-800 text-neutral-700 uppercase tracking-wider">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={!editingBranch}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full h-10 pl-8 pr-8 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-brand-primary"
                      />
                      <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 4. PHONE & CITY ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-10 pl-8 pr-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                    />
                    <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    City
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-10 pl-8 pr-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                    />
                    <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* ── 5. STREET ADDRESS & GST NUMBER ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    Full Street Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Block B, Inner Circle, Connaught Place"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full h-10 pl-8 pr-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                    />
                    <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-800 text-neutral-500 uppercase tracking-wider">
                    GSTIN (Tax ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="07AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full h-10 pl-8 pr-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl text-xs font-mono font-bold uppercase text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-primary focus:bg-white"
                    />
                    <FileText size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* ── 6. FEATURE TOGGLES ── */}
              <div className="p-4 bg-[#FAFAF9] border border-neutral-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/70">
                  <div>
                    <span className="block text-[11px] font-900 text-neutral-800 uppercase tracking-wider">
                      Active Operational Modules
                    </span>
                    <span className="block text-[10px] text-neutral-500 font-medium">
                      Select services enabled for this outlet. Disabled items will disappear from staff drawer & navbars.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const preset = getPresetFeatureToggles(formData.restaurantType);
                      setFormData({
                        ...formData,
                        featureToggles: preset,
                      });
                      toast.success(`Applied ${formData.restaurantType.toUpperCase()} preset`);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-neutral-600 hover:text-brand-primary bg-white hover:bg-orange-50 border border-neutral-200 hover:border-brand-primary/40 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Apply recommended preset for selected outlet type"
                  >
                    <RotateCcw size={11} />
                    <span>Apply Preset</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {[
                    {
                      key: "pos",
                      label: "POS Billing Terminal",
                      desc: "Rapid order taking, Indian portion variants (Half/Full), addon modifiers, promo discounts & counter checkout",
                      icon: ShoppingBag,
                      badge: "Core",
                    },
                    {
                      key: "kds",
                      alias: "kotKitchen",
                      label: "Kitchen Display (KOT)",
                      desc: "Real-time kitchen order tickets & station routing (Tandoor, Chinese, Fast Food, Main Kitchen, Beverages)",
                      icon: ChefHat,
                    },
                    {
                      key: "reception",
                      alias: "receptionView",
                      label: "Reception / Queue Screen",
                      desc: "Customer token number calling board & pickup status display screen for takeaway counter",
                      icon: TrendingUp,
                    },
                    {
                      key: "delivery",
                      alias: "deliveryFleet",
                      label: "Delivery Fleet & Drivers",
                      desc: "Driver web app pairing QR, dispatch management, delivery vehicle registry & driver cash drop reconciliation",
                      icon: Truck,
                    },
                    {
                      key: "accountClosing",
                      label: "Day-End EOD Closing",
                      desc: "Cashier shift closing, till cash counting, shortage/excess tracking & daily EOD accounting reconciliation",
                      icon: FileCheck,
                    },
                    {
                      key: "expenses",
                      label: "Petty Cash & Expenses",
                      desc: "Daily store payouts, milk/vegetables/raw material kharcha logging & cash register expense receipts",
                      icon: Wallet,
                    },
                    {
                      key: "attendance",
                      alias: "employeeAttendance",
                      label: "Staff Attendance & Scheduling",
                      desc: "Staff PIN-based biometric clock-in/out, daily hours report, overtime calculation & weekly shift rosters",
                      icon: Clock,
                    },
                    {
                      key: "reports",
                      label: "Sales Reports & Analytics",
                      desc: "Item-wise sales ranking, hourly sales rush graphs, payment method split & daily sales summary",
                      icon: BarChart3,
                    },
                    {
                      key: "customers",
                      label: "Customer CRM Directory",
                      desc: "Customer phone directory, saved delivery addresses, visit history & past orders record",
                      icon: Users,
                    },
                    {
                      key: "tableManagement",
                      label: "Dine-In Table Layout",
                      desc: "Dining hall floor plan, table capacity & real-time occupancy status (Available, Occupied, Billed) (Beta)",
                      icon: TableProperties,
                      badge: "Beta",
                    },
                  ].map((feat) => {
                    const isEnabled = (formData.featureToggles as any)[feat.key] ?? false;
                    const FeatIcon = feat.icon;

                    const toggleFeat = () => {
                      const nextVal = !isEnabled;
                      const nextToggles = {
                        ...formData.featureToggles,
                        [feat.key]: nextVal,
                      };
                      if (feat.alias) {
                        (nextToggles as any)[feat.alias] = nextVal;
                      }
                      setFormData({
                        ...formData,
                        featureToggles: nextToggles,
                      });
                    };

                    return (
                      <div
                        key={feat.key}
                        onClick={toggleFeat}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5 ${
                          isEnabled
                            ? "bg-white border-brand-primary text-neutral-900 shadow-xs ring-1 ring-brand-primary/25"
                            : "bg-white/60 border-neutral-200 text-neutral-400 hover:bg-white hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                isEnabled ? "bg-brand-primary text-white shadow-2xs" : "bg-neutral-100 text-neutral-400"
                              }`}
                            >
                              <FeatIcon size={14} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[12px] font-bold ${isEnabled ? "text-neutral-900" : "text-neutral-600"}`}>
                                {feat.label}
                              </span>
                              {feat.badge && (
                                <span
                                  className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    feat.badge === "Core"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-purple-100 text-purple-800 border border-purple-200"
                                  }`}
                                >
                                  {feat.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => {}} // handled by parent div onClick
                            className="rounded border-neutral-300 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                          />
                        </div>

                        <p className="text-[10.5px] text-neutral-500 font-medium leading-relaxed pl-9">
                          {feat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 7. LOCATION NOTE ── */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Location Note:</strong> Restaurant GPS coordinates will be captured directly by the branch manager in the POS Settings tab before Super Admin can take this branch <strong>Live</strong>.
                </span>
              </div>

              {/* ── 8. ACTIVE TOGGLE ── */}
              <div className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-neutral-200 rounded-xl">
                <div>
                  <span className="block text-[10.5px] font-800 text-neutral-800 uppercase tracking-wider">
                    Branch Operational (Active)
                  </span>
                  <span className="block text-[8.5px] text-neutral-400">
                    Inactive branches cannot log in or take customer orders.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isActive ? "bg-emerald-600" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? "translate-x-[20px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* ── MODAL FOOTER BUTTONS ── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-800 rounded-xl transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  {submitting ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
