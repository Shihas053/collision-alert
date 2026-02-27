import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, ShieldAlert, Ambulance, Flame, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'police',
    latitude: '',
    longitude: '',
    address: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await axios.post(`${API}/contacts`, formData);
      toast.success('Contact added successfully');
      setDialogOpen(false);
      setFormData({ name: '', phone: '', role: 'police' });
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/contacts/${id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      police: ShieldAlert,
      ambulance: Ambulance,
      fire: Flame,
    };
    return icons[role] || ShieldAlert;
  };

  const getRoleColor = (role) => {
    const colors = {
      police: 'text-blue-500 bg-blue-500/15',
      ambulance: 'text-red-500 bg-red-500/15',
      fire: 'text-orange-500 bg-orange-500/15',
    };
    return colors[role] || colors.police;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} data-testid="contacts-title">
            Emergency Contacts
          </h1>
          <p className="text-sm text-muted-foreground">Configure emergency response contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_10px_rgba(59,130,246,0.5)] uppercase tracking-wider font-bold" data-testid="add-contact-button">
              <Plus className="w-5 h-5 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f172a] border-border/40">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Add Emergency Contact
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter contact name"
                  className="mt-2"
                  data-testid="contact-name-input"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="mt-2"
                  data-testid="contact-phone-input"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-xs uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="mt-2" data-testid="contact-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="police">Police</SelectItem>
                    <SelectItem value="ambulance">Ambulance</SelectItem>
                    <SelectItem value="fire">Fire Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 uppercase tracking-wider" data-testid="submit-contact-button">
                Add Contact
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-md border-border/40">
          <CardContent className="py-12 text-center">
            <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No emergency contacts configured yet.</p>
            <p className="text-sm text-muted-foreground">Add contacts to enable automated alert notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="contacts-grid">
          {contacts.map((contact) => {
            const RoleIcon = getRoleIcon(contact.role);
            return (
              <Card key={contact.id} className="bg-card/50 backdrop-blur-md border-border/40" data-testid={`contact-card-${contact.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRoleColor(contact.role)}`}>
                      <RoleIcon className="w-6 h-6" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(contact.id)}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`delete-contact-${contact.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {contact.role}
                  </div>
                  <h3 className="text-lg font-semibold mb-1" data-testid="contact-name">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground" data-testid="contact-phone">{contact.phone}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Contacts;