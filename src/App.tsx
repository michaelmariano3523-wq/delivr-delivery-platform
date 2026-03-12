import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Settings, 
  Truck, 
  Store, 
  Plus, 
  Check, 
  X, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  Star, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Users, 
  ClipboardList,
  Wallet,
  TrendingUp,
  Trash2,
  ShoppingBag,
  Bike,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function DeliveryMap({ driverLoc, restaurantLoc, clientLoc }: any) {
  const scale = 50000; // zoom level adjusted
  const centerX = 150;
  const centerY = 150;

  const getPos = (loc: any) => {
    if (!loc || !restaurantLoc) return { x: centerX, y: centerY };
    return {
      x: centerX + (loc.lng - restaurantLoc.lng) * scale,
      y: centerY - (loc.lat - restaurantLoc.lat) * scale
    };
  };

  const drv = getPos(driverLoc);
  const cli = getPos(clientLoc);
  const res = { x: centerX, y: centerY };

  // Calculate distances
  const distToCli = driverLoc && clientLoc ? calculateDistance(driverLoc.lat, driverLoc.lng, clientLoc.lat, clientLoc.lng) : 0;
  const distToRes = driverLoc && restaurantLoc ? calculateDistance(driverLoc.lat, driverLoc.lng, restaurantLoc.lat, restaurantLoc.lng) : 0;

  return (
    <div className="relative h-[300px] w-full bg-slate-100 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <svg className="absolute inset-0 h-full w-full">
        <motion.path 
          d={`M ${res.x} ${res.y} L ${cli.x} ${cli.y}`}
          stroke="black" strokeWidth="2" strokeDasharray="4 4" opacity="0.1" fill="none"
        />
      </svg>

      {/* Restaurant */}
      <div className="absolute" style={{ left: res.x, top: res.y, transform: 'translate(-50%, -50%)' }}>
        <div className="bg-black text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
          <Store size={14} />
        </div>
      </div>

      {/* Client */}
      <div className="absolute" style={{ left: cli.x, top: cli.y, transform: 'translate(-50%, -50%)' }}>
        <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
          <User size={14} />
        </div>
      </div>

      {/* Driver (Motinha) */}
      <motion.div 
        animate={{ left: drv.x, top: drv.y }}
        transition={{ type: 'spring', stiffness: 40, damping: 15 }}
        className="absolute z-10" 
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <div className="bg-amber-400 text-black p-3 rounded-full shadow-2xl ring-4 ring-white">
          <Bike size={20} className="animate-pulse" />
        </div>
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg mt-2 border border-black/5 flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
           <p className="text-[10px] font-black whitespace-nowrap">VOCÊ • {distToCli < 0.1 ? "CHEGANDO" : `${distToCli.toFixed(1)}km`}</p>
        </div>
      </motion.div>

      <div className="absolute bottom-4 left-4 right-4 flex gap-3">
         <Card className="flex-1 bg-white/60 backdrop-blur-md p-3 border-none flex items-center justify-between">
            <div>
               <p className="text-[8px] font-black text-black/40 uppercase">Para Loja</p>
               <p className="text-xs font-black">{distToRes.toFixed(2)} km</p>
            </div>
            <Store size={12} className="text-black/20" />
         </Card>
         <Card className="flex-1 bg-white/60 backdrop-blur-md p-3 border-none flex items-center justify-between">
            <div>
               <p className="text-[8px] font-black text-black/40 uppercase">Para Cliente</p>
               <p className="text-xs font-black">{distToCli.toFixed(2)} km</p>
            </div>
            <User size={12} className="text-emerald-500/40" />
         </Card>
      </div>
    </div>
  );
}

function APKDownload() {
  return (
    <div className="fixed bottom-6 right-6 z-[100] group">
      <div className="absolute -inset-2 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <a 
        href="https://delivr.app/download" 
        target="_blank"
        rel="noreferrer"
        className="relative flex items-center gap-3 bg-black text-white px-6 py-4 rounded-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <div className="bg-emerald-500 p-2 rounded-xl">
          <Download size={20} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase opacity-50">Mobile App</p>
          <p className="text-sm font-black">Baixar APK</p>
        </div>
      </a>
    </div>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'admin' | 'client' | 'restaurant' | 'driver';
type Status = 'pending' | 'approved';

interface UserData {
  id: number;
  username: string;
  role: Role;
  status: Status;
  name: string;
  id_document?: string;
  selfie?: string;
}

interface Restaurant {
  id: number;
  userId: number;
  name: string;
  address: string;
  category: string;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Order {
  id: number;
  clientId: number;
  restaurantId: number;
  driverId: number | null;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered';
  total_price: number;
  client_lat: number;
  client_lng: number;
  address?: string;
  created_at: string;
  restaurantName?: string;
  clientName?: string;
  restaurantAddress?: string;
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'ghost' | 'default', size?: 'default' | 'icon' | 'sm' }>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      variant === 'default' ? "bg-black text-white hover:bg-black/90" : "bg-transparent text-black hover:bg-black/5",
      size === 'icon' ? "h-10 w-10 p-0" : size === 'sm' ? "h-8 px-3 text-xs" : "h-10 px-4",
      className
    )}
    {...props}
  />
));

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-black/5 bg-white p-6 shadow-sm", className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // If the saved user has large image fields (from previous versions), clear it
        if (parsedUser.id_document || parsedUser.selfie) {
          localStorage.removeItem('user');
          return;
        }
        setUser(parsedUser);
        setView('dashboard');
      }
    } catch (e) {
      console.error('Error loading user from localStorage:', e);
      localStorage.removeItem('user');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setView('login');
  };

  if (view === 'login') return (
    <LoginView 
      onLogin={(u) => { 
        setUser(u); 
        setView('dashboard'); 
        try {
          localStorage.setItem('user', JSON.stringify(u)); 
        } catch (e) {
          console.error('Failed to save user to localStorage:', e);
          // If it fails, we still have the user in memory, but they'll have to login again next time
        }
      }} 
      onGoToRegister={() => setView('register')} 
    />
  );
  if (view === 'register') return <RegisterView onRegister={() => setView('login')} onGoToLogin={() => setView('login')} />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-black">
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">DelivR</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-black/50 capitalize">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-black/5">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        {user?.role === 'admin' && <AdminDashboard user={user} />}
        {user?.role === 'restaurant' && <RestaurantDashboard user={user} />}
        {user?.role === 'driver' && <DriverDashboard user={user} />}
        {user?.role === 'client' && <ClientDashboard user={user} />}
      </main>
      <APKDownload />
    </div>
  );
}

// --- Auth Views ---

function LoginView({ onLogin, onGoToRegister }: { onLogin: (u: UserData) => void, onGoToRegister: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) onLogin(data);
    else setError(data.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
            <p className="text-black/50">Entre na sua conta DelivR</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Usuário</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none" 
                required 
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full py-3">Entrar</Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={onGoToRegister} className="text-sm font-medium hover:underline">Não tem conta? Cadastre-se</button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function RegisterView({ onRegister, onGoToLogin }: { onRegister: () => void, onGoToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'client' && (!idDoc || !selfie)) {
      setError('Documento de identidade e selfie são obrigatórios para clientes.');
      return;
    }
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role, id_document: idDoc, selfie })
    });
    const data = await res.json();
    if (res.ok) onRegister();
    else setError(data.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Criar conta</h1>
            <p className="text-black/50">Junte-se à comunidade DelivR</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Usuário</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo de Conta</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-black/10 px-4 py-2 focus:border-black focus:outline-none"
              >
                <option value="client">Cliente (Requer Aprovação)</option>
                <option value="restaurant">Restaurante</option>
                <option value="driver">Entregador</option>
              </select>
            </div>

            {role === 'client' && (
              <div className="space-y-4 rounded-xl bg-black/5 p-4">
                <p className="text-xs font-bold uppercase text-black/40">Verificação Obrigatória</p>
                <div>
                  <label className="mb-1 block text-xs font-medium">Documento de Identidade (RG/CNH)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIdDoc)} className="text-xs" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Selfie com Documento</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSelfie)} className="text-xs" required />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full py-3">Cadastrar</Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={onGoToLogin} className="text-sm font-medium hover:underline">Já tem conta? Entre aqui</button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// --- Admin Dashboard ---

function AdminDashboard({ user }: { user: UserData }) {
  const [pendingClients, setPendingClients] = useState<UserData[]>([]);
  const [stats, setStats] = useState<{ restaurantStats: any[], driverStats: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'approvals' | 'stats' | 'register'>('approvals');

  useEffect(() => {
    fetchPending();
    fetchStats();
  }, []);

  const fetchPending = async () => {
    const res = await fetch('/api/admin/pending-clients');
    setPendingClients(await res.json());
  };

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    setStats(await res.json());
  };

  const approveClient = async (userId: number) => {
    await fetch('/api/admin/approve-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    fetchPending();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => setActiveTab('approvals')} 
          className={cn(activeTab !== 'approvals' && "bg-transparent text-black hover:bg-black/5")}
        >
          <Users size={18} className="mr-2" />
          Aprovações ({pendingClients.length})
        </Button>
        <Button 
          onClick={() => setActiveTab('stats')} 
          className={cn(activeTab !== 'stats' && "bg-transparent text-black hover:bg-black/5")}
        >
          <BarChart3 size={18} className="mr-2" />
          Estatísticas
        </Button>
        <Button 
          onClick={() => setActiveTab('register')} 
          className={cn(activeTab !== 'register' && "bg-transparent text-black hover:bg-black/5")}
        >
          <Plus size={18} className="mr-2" />
          Cadastrar Restaurante/Entregador
        </Button>
      </div>

      {activeTab === 'approvals' && (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingClients.map(client => (
            <Card key={client.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{client.name}</p>
                  <p className="text-sm text-black/50">@{client.username}</p>
                </div>
                <Button size="sm" onClick={() => approveClient(client.id)} className="rounded-full bg-emerald-500 hover:bg-emerald-600">
                  <Check size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-black/40">Documento</p>
                  <img src={client.id_document} alt="ID" className="h-24 w-full rounded-lg object-cover border border-black/5" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-black/40">Selfie</p>
                  <img src={client.selfie} alt="Selfie" className="h-24 w-full rounded-lg object-cover border border-black/5" referrerPolicy="no-referrer" />
                </div>
              </div>
            </Card>
          ))}
          {pendingClients.length === 0 && <p className="col-span-full py-8 text-center text-black/50">Nenhuma aprovação pendente.</p>}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <Store size={18} /> Ganhos por Restaurante
            </h3>
            <div className="space-y-4">
              {stats.restaurantStats.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span>{s.name}</span>
                  <span className="font-mono font-bold">R$ {s.total_earnings.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <Truck size={18} /> Entregas por Entregador
            </h3>
            <div className="space-y-4">
              {stats.driverStats.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span>{s.name}</span>
                  <span className="font-bold">{s.total_deliveries} entregas</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'register' && <AdminRegisterForm />}
    </div>
  );
}

function AdminRegisterForm() {
  const [type, setType] = useState<'restaurant' | 'driver'>('restaurant');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role: type })
    });
    const userData = await res.json();
    
    if (res.ok && type === 'restaurant') {
      await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, name, address, category })
      });
    }
    setMsg('Cadastrado com sucesso!');
    setName(''); setUsername(''); setPassword(''); setAddress(''); setCategory('');
  };

  return (
    <Card className="max-w-2xl">
      <h3 className="mb-6 text-xl font-bold">Novo Cadastro</h3>
      <div className="mb-6 flex gap-4">
        <Button onClick={() => setType('restaurant')} className={cn(type !== 'restaurant' && "bg-transparent text-black hover:bg-black/5")}>Restaurante</Button>
        <Button onClick={() => setType('driver')} className={cn(type !== 'driver' && "bg-transparent text-black hover:bg-black/5")}>Entregador</Button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Usuário</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        </div>
        {type === 'restaurant' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Endereço</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Categoria</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <Button type="submit" className="w-full">Cadastrar {type === 'restaurant' ? 'Restaurante' : 'Entregador'}</Button>
          {msg && <p className="mt-2 text-center text-emerald-500">{msg}</p>}
        </div>
      </form>
    </Card>
  );
}

// --- Restaurant Dashboard ---

function RestaurantDashboard({ user }: { user: UserData }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'finance'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const resRest = await fetch('/api/restaurants');
      const rests = await resRest.json();
      const myRest = rests.find((r: any) => r.userId === user.id);
      if (myRest) {
        setRestaurant(myRest);
        const [resOrders, resMenu, resStats] = await Promise.all([
          fetch(`/api/orders/restaurant/${user.id}`),
          fetch(`/api/restaurants/${myRest.id}/menu`),
          fetch(`/api/stats/restaurant/${user.id}`)
        ]);
        setOrders(await resOrders.json());
        setMenu(await resMenu.json());
        setStats(await resStats.json());
      }
    } catch (e) {
      console.error('Failed to fetch restaurant data:', e);
    } finally {
      setFetching(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => setActiveTab('orders')} className={cn(activeTab !== 'orders' && "bg-transparent text-black hover:bg-black/5")}>
          <ClipboardList size={18} className="mr-2" /> Pedidos
        </Button>
        <Button onClick={() => setActiveTab('menu')} className={cn(activeTab !== 'menu' && "bg-transparent text-black hover:bg-black/5")}>
          <Plus size={18} className="mr-2" /> Cardápio
        </Button>
        <Button onClick={() => setActiveTab('finance')} className={cn(activeTab !== 'finance' && "bg-transparent text-black hover:bg-black/5")}>
          <Wallet size={18} className="mr-2" /> Finanças
        </Button>
      </div>

      {!fetching && !restaurant && (
        <RestaurantSetupForm userId={user.id} onComplete={fetchData} />
      )}

      {!fetching && restaurant && activeTab === 'orders' && (
        <div className="grid gap-4">
          {orders.map(order => (
            <Card key={order.id} className="flex items-center justify-between">
              <div>
                <p className="font-bold">Pedido #{order.id}</p>
                <p className="text-sm text-black/50">Cliente: {order.clientName}</p>
                <p className="text-sm font-mono">R$ {order.total_price.toFixed(2)}</p>
                <span className={cn(
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  order.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {order.status}
                </span>
              </div>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>Preparar</Button>
                )}
                {order.status === 'preparing' && (
                  <p className="text-sm text-black/50 italic">Aguardando entregador...</p>
                )}
              </div>
            </Card>
          ))}
          {orders.length === 0 && <p className="py-8 text-center text-black/50">Nenhum pedido recebido.</p>}
        </div>
      )}

      {!fetching && restaurant && activeTab === 'finance' && stats && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-black text-white p-6">
              <p className="text-sm text-white/60 mb-1">Ganhos Brutos</p>
              <p className="text-3xl font-bold">R$ {stats.gross.toFixed(2)}</p>
              <div className="mt-4 flex items-center text-xs text-white/40">
                <TrendingUp size={14} className="mr-1" /> Total vendido na plataforma
              </div>
            </Card>
            <Card className="bg-emerald-600 text-white p-6">
              <p className="text-sm text-white/60 mb-1">Ganhos Líquidos (a receber)</p>
              <p className="text-3xl font-bold">R$ {stats.net.toFixed(2)}</p>
              <div className="mt-4 flex items-center text-xs text-white/40">
                <Wallet size={14} className="mr-1" /> Descontado 13% de taxa Delivr
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-black/50 mb-1">Pedidos Concluídos</p>
              <p className="text-3xl font-bold">{stats.count}</p>
              <div className="mt-4 flex items-center text-xs text-black/30">
                <Users size={14} className="mr-1" /> Volume de vendas total
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="mb-6 font-bold flex items-center gap-2">
              <TrendingUp size={18} /> Performance Diária (Últimos 7 dias)
            </h3>
            <div className="space-y-4">
              {stats.daily.length > 0 ? stats.daily.map((d: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{d.day}</span>
                    <span className="font-mono">R$ {d.gross.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black rounded-full" 
                      style={{ width: `${Math.min(100, (d.gross / (stats.gross || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-black/30">Dados insuficientes para gerar gráfico.</p>
              )}
            </div>
          </Card>

          <Card className="h-64 flex items-center justify-center border-dashed">
            <div className="text-center">
              <MapPin size={32} className="mx-auto mb-2 text-black/20" />
              <p className="text-sm text-black/50">Mapa de Calor e Logística em breve</p>
            </div>
          </Card>
        </div>
      )}

      {!fetching && restaurant && activeTab === 'menu' && (
        <div className="space-y-8">
          <AddMenuItemForm restaurantId={restaurant.id} onAdded={fetchData} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menu.map(item => (
              <Card key={item.id} className="overflow-hidden p-0">
                <img src={item.image} alt={item.name} className="h-40 w-full object-cover" referrerPolicy="no-referrer" />
                <div className="p-4">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-black/50 line-clamp-2">{item.description}</p>
                  <p className="mt-2 font-mono font-bold text-emerald-600">R$ {item.price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RestaurantSetupForm({ userId, onComplete }: { userId: number, onComplete: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, address, category })
      });
      if (res.ok) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to setup restaurant:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto border-emerald-500 bg-emerald-50/10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          <Store size={32} />
        </div>
        <h3 className="text-2xl font-black tracking-tight">Configure seu Restaurante</h3>
        <p className="text-sm text-black/50">Você precisa criar um perfil antes de gerenciar o cardápio.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/30 ml-2">Nome do Estabelecimento</label>
          <input placeholder="Ex: Central Burger" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500" required />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/30 ml-2">Endereço Completo</label>
          <input placeholder="Rua, Número, Bairro" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500" required />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/30 ml-2">Categoria</label>
          <input placeholder="Ex: 🍔 Burger, 🍕 Pizza" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500" required />
        </div>
        <Button type="submit" disabled={loading} className="h-14 w-full bg-emerald-600 text-white hover:bg-emerald-500 font-black uppercase tracking-widest transition-all">
          {loading ? "Criando Perfil..." : "Começar Agora"}
        </Button>
      </form>
    </Card>
  );
}

function AddMenuItemForm({ restaurantId, onAdded }: { restaurantId: number, onAdded: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, price: parseFloat(price), image })
      });
      if (res.ok) {
        setName(''); setDesc(''); setPrice(''); setImage('');
        onAdded();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao adicionar item');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl border-none bg-black/5">
      <h3 className="mb-4 text-xl font-black tracking-tight">Adicionar ao Cardápio</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/30 ml-2">Nome do prato</label>
          <input placeholder="Ex: Burger Gourmet" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-black" required />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/30 ml-2">Descrição</label>
          <textarea placeholder="Ingredientes e detalhes..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-black min-h-[100px]" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/30 ml-2">Preço (R$)</label>
            <input type="number" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-black" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/30 ml-2">URL da Imagem</label>
            <input placeholder="https://..." value={image} onChange={e => setImage(e.target.value)} className="w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm focus:ring-2 focus:ring-black" required />
          </div>
        </div>
        {error && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
        <Button type="submit" disabled={loading} className="h-14 w-full bg-black text-white hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest">
          {loading ? "Adicionando..." : "Cadastrar Produto"}
        </Button>
      </form>
    </Card>
  );
}

// --- Driver Dashboard ---

function DriverDashboard({ user }: { user: UserData }) {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');
  const socketRef = useRef<WebSocket | null>(null);

  // Restore active order and online status after page refresh
  useEffect(() => {
    const restoreActiveOrder = async () => {
      try {
        const [resOrder, resStats] = await Promise.all([
          fetch(`/api/orders/driver/${user.id}/active`),
          fetch(`/api/stats/driver/${user.id}`)
        ]);
        const order = await resOrder.json();
        if (order && order.id) {
          setActiveOrder(order);
          setIsOnline(true);
        }
        setStats(await resStats.json());
      } catch (e) {
        console.error('Failed to restore driver state:', e);
      }
    };
    restoreActiveOrder();
  }, [user.id]);

  useEffect(() => {
    if (isOnline) {
      fetchAvailable();
      const interval = setInterval(fetchAvailable, 5000);
      
      // Start tracking
      let watchId: number;
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverLoc(loc);
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'update_location',
              driverId: user.id,
              orderId: activeOrder?.id,
              ...loc
            }));
          }
        });
      }

      return () => {
        clearInterval(interval);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isOnline, activeOrder?.id]);

  useEffect(() => {
    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const goOnline = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsOnline(true);
          setLocationError(null);
        },
        (err) => {
          setLocationError('Permissão de localização negada. É necessário para trabalhar.');
        }
      );
    } else {
      setLocationError('Geolocalização não suportada pelo seu navegador.');
    }
  };

  const fetchAvailable = async () => {
    const res = await fetch('/api/orders/driver/available');
    setAvailableOrders(await res.json());
    // Refresh stats too
    const resStats = await fetch(`/api/stats/driver/${user.id}`);
    setStats(await resStats.json());
  };

  const acceptOrder = async (orderId: number) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'out_for_delivery', driverId: user.id })
    });
    const order = availableOrders.find(o => o.id === orderId);
    if (order) setActiveOrder({ ...order, status: 'out_for_delivery' });
    fetchAvailable();
  };

  const completeOrder = async (orderId: number) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' })
    });
    setActiveOrder(null);
    fetchAvailable();
  };

  return (
    <div className="space-y-8">
      {isOnline && (
        <div className="flex gap-4">
          <Button onClick={() => setActiveTab('orders')} className={cn(activeTab !== 'orders' && "bg-transparent text-black hover:bg-black/5")}>
            <MapPin size={18} className="mr-2" /> Entregas
          </Button>
          <Button onClick={() => setActiveTab('stats')} className={cn(activeTab !== 'stats' && "bg-transparent text-black hover:bg-black/5")}>
            <BarChart3 size={18} className="mr-2" /> Estatísticas
          </Button>
        </div>
      )}

      {!isOnline ? (
        <Card className="py-12 text-center">
          <Truck size={48} className="mx-auto mb-4 text-black/10" />
          <h3 className="mb-2 text-xl font-bold">Pronto para trabalhar?</h3>
          <p className="mb-6 text-black/50">Ative sua localização para começar a receber pedidos.</p>
          {locationError && <p className="mb-4 text-sm text-red-500">{locationError}</p>}
          <Button onClick={goOnline} className="px-8">Ficar Online</Button>
        </Card>
      ) : activeTab === 'stats' && stats ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-emerald-600 text-white p-6">
              <p className="text-sm text-white/60 mb-1">Total de Ganhos</p>
              <p className="text-3xl font-bold">R$ {stats.earnings.toFixed(2)}</p>
              <div className="mt-4 flex items-center text-xs text-white/40">
                <DollarSign size={14} className="mr-1" /> Seu lucro acumulado
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-black/50 mb-1">Corridas Finalizadas</p>
              <p className="text-3xl font-bold">{stats.count}</p>
              <div className="mt-4 flex items-center text-xs text-black/30">
                <Truck size={14} className="mr-1" /> Entregas bem-sucedidas
              </div>
            </Card>
          </div>
          
          <Card>
            <h3 className="mb-4 font-bold">Últimas Atividades</h3>
            <p className="text-center py-8 text-black/30 italic">O histórico detalhado de corridas aparecerá aqui.</p>
          </Card>
        </div>
      ) : activeOrder ? (
        <Card className="border-emerald-500 bg-emerald-50/10 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Truck size={24} />
              </div>
              <h3 className="text-xl font-bold">Entrega em Andamento</h3>
            </div>
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">Ativo</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/10">
                <div className="relative mb-4">
                  <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-white" />
                  <p className="text-xs text-black/40 uppercase font-bold tracking-tight">Retirada</p>
                  <p className="font-medium text-sm">{activeOrder.restaurantName}</p>
                  <p className="text-[10px] text-black/50">{activeOrder.restaurantAddress}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="text-xs text-emerald-500/60 uppercase font-bold tracking-tight">Entrega</p>
                  <p className="font-medium text-sm">{activeOrder.address}</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 mt-4 overflow-hidden rounded-3xl border border-black/5">
               <DeliveryMap 
                 driverLoc={driverLoc} 
                 restaurantLoc={{ lat: activeOrder.restaurantLat, lng: activeOrder.restaurantLng }}
                 clientLoc={{ lat: activeOrder.client_lat, lng: activeOrder.client_lng }}
               />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`)}>
               <MapPin size={16} className="mr-2" /> Ver Rota
             </Button>
            <Button onClick={() => completeOrder(activeOrder.id)} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
              Marcar como Entregue
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Pedidos Disponíveis</h3>
            {stats && (
              <div className="px-3 py-1 bg-black/5 rounded-full text-xs font-medium">
                Hoje: <span className="font-bold">R$ {stats.earnings.toFixed(2)}</span>
              </div>
            )}
          </div>
          {availableOrders.map(order => (
            <Card key={order.id} className="flex items-center justify-between">
              <div>
                <p className="font-bold">{order.restaurantName}</p>
                <p className="text-sm text-black/50">De: {order.restaurantAddress}</p>
                <p className="text-sm text-black/50">Para: {order.address}</p>
                <p className="mt-1 font-mono text-sm">R$ {order.total_price.toFixed(2)}</p>
              </div>
              <Button onClick={() => acceptOrder(order.id)}>Aceitar</Button>
            </Card>
          ))}
          {availableOrders.length === 0 && <p className="py-8 text-center text-black/50">Nenhum pedido disponível no momento.</p>}
        </div>
      )}
    </div>
  );
}

// --- Client Dashboard ---

function ClientDashboard({ user }: { user: UserData }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem, quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<{ id: number, lat: number, lng: number } | null>(null);
  const [pixData, setPixData] = useState<{ orderId: number, pixText: string, qrCodeBase64: string } | null>(null);
  const [pixStatus, setPixStatus] = useState<'awaiting' | 'paid' | 'error'>('awaiting');
  const [pixCountdown, setPixCountdown] = useState(600); // 10 minutes
  const [pixCopied, setPixCopied] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Bug fix: driver sends 'update_location', not 'location_update'
      if (data.type === 'update_location') {
        setTrackingOrder(prev => {
          if (prev && prev.id === data.orderId) {
            return { id: data.orderId, lat: data.lat, lng: data.lng };
          }
          // Auto-start tracking if not already tracking this order
          if (data.orderId) {
            return { id: data.orderId, lat: data.lat, lng: data.lng };
          }
          return prev;
        });
      }
    };
    return () => ws.close();
  }, []);

  const fetchRestaurants = async () => {
    const res = await fetch('/api/restaurants');
    setRestaurants(await res.json());
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders/client/${user.id}`);
    setOrders(await res.json());
  };

  const selectRestaurant = async (r: Restaurant) => {
    setSelectedRestaurant(r);
    const res = await fetch(`/api/restaurants/${r.id}/menu`);
    setMenu(await res.json());
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(p => p.item.id !== itemId));
  };

  const totalPrice = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);

  const placeOrder = async () => {
    if (user.status !== 'approved') {
      alert('Sua conta ainda não foi aprovada pelo administrador.');
      return;
    }

    if (!address.trim()) {
      alert('Por favor, informe seu endereço de entrega.');
      return;
    }

    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);

    const doRequest = async (lat: number, lng: number) => {
      const res = await fetch('/api/payment/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          restaurantId: selectedRestaurant!.id,
          items: cart.map(i => ({ id: i.item.id, quantity: i.quantity, price: i.item.price })),
          totalPrice, lat, lng, address
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPixData({ orderId: data.orderId, pixText: data.pixText, qrCodeBase64: data.qrCodeBase64 });
        setPixStatus('awaiting');
        setPixCountdown(600);
        setShowConfirm(false);
        setCart([]);
        setSelectedRestaurant(null);
        setAddress('');

        const interval = setInterval(async () => {
          try {
            const r = await fetch(`/api/payment/status/${data.orderId}`);
            const s = await r.json();
            if (s.status === 'paid') {
              setPixStatus('paid');
              clearInterval(interval);
              fetchOrders();
            }
          } catch {}
        }, 3000);

        const timer = setInterval(() => {
          setPixCountdown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(data.error || 'Erro ao gerar PIX');
      }
      setCheckoutLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doRequest(pos.coords.latitude, pos.coords.longitude),
        () => doRequest(0, 0)
      );
    } else {
      doRequest(0, 0);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Tracking Banner */}
      {trackingOrder && (
        <Card className="border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                <Truck size={24} />
              </div>
              <div>
                <p className="font-black text-emerald-900 tracking-tight">Seu pedido está chegando!</p>
                <div className="flex items-center gap-2 text-xs text-emerald-700/60">
                   <MapPin size={12} />
                   <span>Localização atualizada em tempo real</span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTrackingOrder(null)} className="hover:bg-emerald-100 text-emerald-600">
              <X size={18} />
            </Button>
          </div>
        </Card>
      )}

      {/* PIX Modal */}
      {pixData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md overflow-hidden bg-white p-0 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <Check size={40} className={cn(pixStatus === 'paid' ? 'scale-100' : 'scale-0')} />
                {pixStatus !== 'paid' && <DollarSign size={40} />}
              </div>
              <h3 className="text-2xl font-black">
                {pixStatus === 'paid' ? 'Pagamento Confirmado!' : 'Aguardando Pagamento'}
              </h3>
              <p className="text-white/60">Delivr • PagSeguro PIX</p>
            </div>
            
            <div className="p-8">
              {pixStatus === 'paid' ? (
                <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                  <p className="mb-6 text-black/60">O restaurante já foi notificado e está preparando seu pedido com carinho.</p>
                  <Button onClick={() => setPixData(null)} className="w-full bg-black">Entendido</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <img src={pixData.qrCodeBase64} alt="QR Code PIX" className="mb-4 h-48 w-48 rounded-xl border border-black/5 p-2 shadow-inner" />
                    <div className="flex items-center gap-2 text-sm font-bold text-black/40">
                      <Clock size={16} />
                      Expira em {Math.floor(pixCountdown / 60)}:{(pixCountdown % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Código Copia e Cola</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={pixData.pixText} 
                        className="flex-1 rounded-xl bg-black/5 px-4 py-2 text-xs font-mono" 
                      />
                      <Button size="sm" onClick={() => {
                        navigator.clipboard.writeText(pixData.pixText);
                        setPixCopied(true);
                        setTimeout(() => setPixCopied(false), 2000);
                      }}>
                        {pixCopied ? <Check size={16} /> : <Plus size={16} />}
                      </Button>
                    </div>
                    {pixCopied && <p className="text-center text-[10px] text-emerald-600 font-bold">Copiado para a área de transferência!</p>}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-4 text-xs font-medium text-amber-700">
                    <Star size={14} />
                    <span>Não feche esta página até o pagamento ser confirmado.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {!selectedRestaurant && !pixData && (
        <>
          <section className="relative overflow-hidden rounded-[2.5rem] bg-black p-10 text-white md:p-16">
            <div className="relative z-10 max-w-xl">
              <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/60">Sua comida favorita</span>
              <h2 className="mb-6 text-5xl font-black leading-none tracking-tighter md:text-7xl">
                O melhor da cidade <span className="text-emerald-500">na sua mão.</span>
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    placeholder="Onde vamos entregar?" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    className="w-full rounded-2xl border-none bg-white/10 pl-12 pr-6 py-5 text-white placeholder:text-white/30 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 h-full w-1/2 opacity-10 blur-3xl">
               <div className="h-full w-full rounded-full bg-emerald-500" />
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tighter">Escolha seu Restaurante</h3>
              <div className="hidden gap-2 md:flex">
                {['Tudo', '🍕 Pizza', '🍔 Burger', '🇯🇵 Japa', '🇮🇹 Massa'].map(cat => (
                  <button key={cat} className="rounded-full bg-black/5 px-6 py-2.5 text-xs font-black uppercase transition-all hover:bg-black hover:text-white">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => selectRestaurant(r)} 
                  className="group cursor-pointer space-y-4"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-black/5 shadow-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-black/10">
                    <img 
                      src={`https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop`} 
                      alt={r.name} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                       <span className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-black uppercase text-black">{r.category}</span>
                    </div>
                  </div>
                  <div className="px-2">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-lg font-black tracking-tight">{r.name}</h4>
                      <div className="flex items-center text-xs font-black text-amber-500">
                        <Star size={14} className="mr-1 fill-amber-500" /> 4.9
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-black/30">
                      <span className="flex items-center"><Clock size={12} className="mr-1" /> 25-40 min</span>
                      <span className="flex items-center"><DollarSign size={12} className="mr-1" /> Grátis</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {orders.length > 0 && (
            <section className="rounded-[2.5rem] bg-black/5 p-8 md:p-12">
              <h3 className="mb-10 text-3xl font-black tracking-tighter">Histórico de Pedidos</h3>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {orders.map(order => (
                  <Card key={order.id} className="group border-none bg-white p-6 shadow-sm shadow-black/5 transition-all hover:shadow-xl">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black/20 font-black">
                         {order.id}
                      </div>
                      <span className={cn(
                        "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest",
                        order.status === 'pending' ? "bg-amber-100 text-amber-600" :
                        order.status === 'preparing' ? "bg-blue-100 text-blue-600" :
                        order.status === 'out_for_delivery' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-black/5 text-black/40"
                      )}>
                        {order.status === 'pending' ? 'Recebido' :
                         order.status === 'preparing' ? 'Preparando' :
                         order.status === 'out_for_delivery' ? 'A caminho' :
                         order.status === 'delivered' ? 'Finalizado' : order.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-1">{order.restaurantName}</h4>
                      <p className="text-xs font-medium text-black/40 mb-6">{new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      
                      <div className="flex items-center justify-between border-t border-black/5 pt-6">
                        <p className="text-lg font-black text-emerald-600">R$ {order.total_price.toFixed(2)}</p>
                        <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] tracking-widest uppercase h-10 px-6 group-hover:bg-black group-hover:text-white transition-all">Ver Detalhes</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {selectedRestaurant && (
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-10">
            <button 
              onClick={() => setSelectedRestaurant(null)} 
              className="group flex items-center text-sm font-black uppercase tracking-widest text-black/40 transition-colors hover:text-black"
            >
              <Plus size={20} className="mr-2 rotate-45 transition-transform group-hover:rotate-0" /> Voltar
            </button>
            
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-5xl font-black tracking-tighter mb-2">{selectedRestaurant.name}</h3>
                <p className="flex items-center text-black/40 font-bold">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] text-emerald-600 mr-3">{selectedRestaurant.category}</span>
                  <MapPin size={14} className="mr-1" /> {selectedRestaurant.address}
                </p>
              </div>
              <div className="flex gap-4">
                 <div className="text-center bg-black/5 rounded-2xl p-4 min-w-[100px]">
                    <p className="text-[10px] font-black uppercase text-black/30">Avaliação</p>
                    <p className="text-xl font-black flex items-center justify-center gap-1">4.8 <Star size={14} className="fill-amber-400 text-amber-400"/></p>
                 </div>
                 <div className="text-center bg-black/5 rounded-2xl p-4 min-w-[100px]">
                    <p className="text-[10px] font-black uppercase text-black/30">Entrega</p>
                    <p className="text-xl font-black">25m</p>
                 </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {menu.map(item => (
                <Card key={item.id} className="group overflow-hidden border-none bg-black/5 p-0 transition-all hover:bg-white hover:shadow-2xl">
                  <div className="flex">
                    <div className="p-6 flex-1 space-y-4">
                      <div>
                        <h4 className="text-lg font-black tracking-tight">{item.name}</h4>
                        <p className="text-xs text-black/40 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-black text-emerald-600 tracking-tighter">R$ {item.price.toFixed(2)}</p>
                        <button 
                          onClick={() => addToCart(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-lg transition-transform active:scale-95"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="aspect-square w-32 overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-24 overflow-hidden border-none bg-black text-white p-0 shadow-2xl">
              <div className="p-8 pb-4">
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                  <ShoppingBag size={24} className="text-emerald-500" /> Seu Pedido
                </h3>
              </div>
              
              <div className="p-8 pt-4 space-y-8">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-white/20">
                    <ShoppingBag size={64} className="mx-auto mb-4 opacity-5" />
                    <p className="text-sm font-bold uppercase tracking-widest">Carrinho Vazio</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map(c => (
                        <div key={c.item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-black">
                               {c.quantity}
                            </div>
                            <div>
                              <p className="font-bold text-sm tracking-tight">{c.item.name}</p>
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">R$ {c.item.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(c.item.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6 border-t border-white/10 pt-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Endereço de Entrega</label>
                        <input 
                          placeholder="Digite o endereço..." 
                          value={address} 
                          onChange={e => setAddress(e.target.value)} 
                          className="w-full rounded-xl border-none bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-emerald-500/50" 
                        />
                      </div>

                      <div className="flex items-end justify-between">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Geral</p>
                        <p className="text-4xl font-black text-emerald-500 tracking-tighter">R$ {cart.reduce((s, i) => s + i.item.price * i.quantity, 0).toFixed(2)}</p>
                      </div>

                      <Button 
                        onClick={confirmOrder} 
                        className="h-16 w-full bg-emerald-600 text-lg font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all" 
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? "Processando..." : "Confirmar e Pagar"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
