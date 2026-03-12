import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
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
  ClipboardList 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resRest = await fetch('/api/restaurants');
    const rests = await resRest.json();
    const myRest = rests.find((r: any) => r.userId === user.id);
    if (myRest) {
      setRestaurant(myRest);
      const resOrders = await fetch(`/api/orders/restaurant/${user.id}`);
      setOrders(await resOrders.json());
      const resMenu = await fetch(`/api/restaurants/${myRest.id}/menu`);
      setMenu(await resMenu.json());
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
      <div className="flex gap-4">
        <Button onClick={() => setActiveTab('orders')} className={cn(activeTab !== 'orders' && "bg-transparent text-black hover:bg-black/5")}>
          <ClipboardList size={18} className="mr-2" /> Pedidos
        </Button>
        <Button onClick={() => setActiveTab('menu')} className={cn(activeTab !== 'menu' && "bg-transparent text-black hover:bg-black/5")}>
          <Plus size={18} className="mr-2" /> Cardápio
        </Button>
      </div>

      {activeTab === 'orders' && (
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

      {activeTab === 'menu' && restaurant && (
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

function AddMenuItemForm({ restaurantId, onAdded }: { restaurantId: number, onAdded: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, price: parseFloat(price), image })
    });
    setName(''); setDesc(''); setPrice(''); setImage('');
    onAdded();
  };

  return (
    <Card className="max-w-xl">
      <h3 className="mb-4 font-bold">Adicionar Item ao Cardápio</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Nome do prato" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        <textarea placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        <div className="flex gap-4">
          <input type="number" step="0.01" placeholder="Preço" value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
          <input placeholder="URL da Imagem" value={image} onChange={e => setImage(e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-2" required />
        </div>
        <Button type="submit" className="w-full">Adicionar</Button>
      </form>
    </Card>
  );
}

// --- Driver Dashboard ---

function DriverDashboard({ user }: { user: UserData }) {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Restore active order and online status after page refresh
  useEffect(() => {
    const restoreActiveOrder = async () => {
      try {
        const res = await fetch(`/api/orders/driver/${user.id}/active`);
        const order = await res.json();
        if (order) {
          setActiveOrder(order);
          setIsOnline(true);
        }
      } catch (e) {
        console.error('Failed to restore active order:', e);
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
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'update_location',
              driverId: user.id,
              orderId: activeOrder?.id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
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
      {!isOnline ? (
        <Card className="py-12 text-center">
          <Truck size={48} className="mx-auto mb-4 text-black/10" />
          <h3 className="mb-2 text-xl font-bold">Pronto para trabalhar?</h3>
          <p className="mb-6 text-black/50">Ative sua localização para começar a receber pedidos.</p>
          {locationError && <p className="mb-4 text-sm text-red-500">{locationError}</p>}
          <Button onClick={goOnline} className="px-8">Ficar Online</Button>
        </Card>
      ) : activeOrder ? (
        <Card className="border-emerald-500 bg-emerald-50/30">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Entrega em Andamento</h3>
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white uppercase">Ativo</span>
          </div>
          <div className="space-y-2">
            <p><strong>Pedido:</strong> #{activeOrder.id}</p>
            <p><strong>Restaurante:</strong> {activeOrder.restaurantName}</p>
            <p><strong>Retirada:</strong> {activeOrder.restaurantAddress}</p>
            <p><strong>Entrega:</strong> {activeOrder.address}</p>
          </div>
          <div className="mt-6">
            <Button onClick={() => completeOrder(activeOrder.id)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Marcar como Entregue
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Pedidos Disponíveis</h3>
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
    const totalPrice = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
    
    // Get client location
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          restaurantId: selectedRestaurant!.id,
          items: cart.map(i => ({ id: i.item.id, quantity: i.quantity, price: i.item.price })),
          totalPrice,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address
        })
      });
      if (res.ok) {
        setCart([]);
        setSelectedRestaurant(null);
        setAddress('');
        setShowConfirm(false);
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    }, () => {
      alert('É necessário compartilhar sua localização para realizar o pedido.');
    });
  };

  return (
    <div className="space-y-8">
      {trackingOrder && (
        <Card className="border-emerald-500 bg-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-white">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-bold">Seu pedido está a caminho!</p>
                <p className="text-xs text-black/50">Localização do entregador: {trackingOrder.lat.toFixed(4)}, {trackingOrder.lng.toFixed(4)}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTrackingOrder(null)}><X size={16} /></Button>
          </div>
        </Card>
      )}

      {!selectedRestaurant ? (
        <div className="space-y-8">
          <section>
            <h3 className="mb-4 text-xl font-bold">Seus Pedidos</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {orders.map(order => (
                <Card key={order.id} className="min-w-[280px] flex-shrink-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-black/30 uppercase">#{order.id}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      order.status === 'delivered' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="font-bold">{order.restaurantName}</p>
                  <p className="text-sm font-mono">R$ {order.total_price.toFixed(2)}</p>
                  {order.status === 'out_for_delivery' && (
                    <Button size="sm" className="mt-4 w-full" onClick={() => setTrackingOrder({ id: order.id, lat: 0, lng: 0 })}>
                      Rastrear
                    </Button>
                  )}
                </Card>
              ))}
              {orders.length === 0 && <p className="text-black/30">Nenhum pedido realizado ainda.</p>}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-bold">Restaurantes</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map(r => (
                <Card key={r.id} className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => selectRestaurant(r)}>
                  <div className="mb-4 h-32 w-full rounded-xl bg-black/5 flex items-center justify-center">
                    <Store size={40} className="text-black/10" />
                  </div>
                  <h4 className="text-lg font-bold">{r.name}</h4>
                  <p className="text-sm text-black/50">{r.category} • {r.address}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-black/60">
                    <span className="flex items-center gap-1"><Star size={14} className="text-amber-400" /> 4.8</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> 20-30 min</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <button onClick={() => setSelectedRestaurant(null)} className="flex items-center gap-2 text-sm font-medium text-black/50 hover:text-black">
              <ChevronRight size={16} className="rotate-180" /> Voltar para restaurantes
            </button>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">{selectedRestaurant.name}</h2>
              <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium">{selectedRestaurant.category}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {menu.map(item => (
                <Card key={item.id} className="flex gap-4 p-4">
                  <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-black/50 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">R$ {item.price.toFixed(2)}</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-black hover:text-white" onClick={() => addToCart(item)}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="mb-6 text-xl font-bold">Seu Carrinho</h3>
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag size={40} className="mx-auto mb-4 text-black/10" />
                  <p className="text-black/50">Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(i => (
                    <div key={i.item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{i.quantity}x</span>
                        <span>{i.item.name}</span>
                      </div>
                      <span className="font-mono">R$ {(i.item.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-6 border-t border-black/5 pt-4">
                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium">Endereço de Entrega</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Rua das Flores, 123"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-xl border border-black/10 px-4 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <span>Total</span>
                      <span className="font-mono">R$ {cart.reduce((s, i) => s + i.item.price * i.quantity, 0).toFixed(2)}</span>
                    </div>
                    <Button className="mt-6 w-full py-4" onClick={placeOrder}>Finalizar Pedido</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <Card className="w-full max-w-md">
                <h3 className="mb-4 text-xl font-bold">Confirmar Pedido</h3>
                <p className="mb-6 text-black/60">
                  Seu pedido será entregue em: <br />
                  <strong className="text-black">{address}</strong>
                </p>
                <p className="mb-6 text-sm text-black/50">
                  Também utilizaremos sua localização GPS atual para ajudar o entregador a encontrar você com mais precisão.
                </p>
                <div className="flex gap-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={confirmOrder}>Confirmar e Pagar</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
