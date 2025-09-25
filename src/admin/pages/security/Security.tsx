import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Switch } from "@/admin/components/ui/switch";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  BanIcon, 
  DownloadIcon,
  ShieldIcon,
  AlertTriangleIcon,
  SaveIcon,
  RotateCcwIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Separator } from "@/admin/components/ui/separator";

interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  ipAddress: string;
  timestamp: Date;
  status: 'success' | 'failed';
  details: string;
}

interface FailedLogin {
  id: number;
  userId: number | null;
  userName: string | null;
  ipAddress: string;
  timestamp: Date;
  reason: string;
  isBlocked: boolean;
}

interface SecuritySettings {
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  allowMultipleSessions: boolean;
  enable2FA: boolean;
  require2FA: boolean;
  whitelistedIPs: string[];
}

const defaultSecuritySettings: SecuritySettings = {
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 60,
  allowMultipleSessions: false,
  enable2FA: true,
  require2FA: false,
  whitelistedIPs: [],
};

const Security = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isViewLogDialogOpen, setIsViewLogDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("activity");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [newWhitelistIP, setNewWhitelistIP] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 10;

  const handleSettingsSave = () => {
    setErrors({});

    // Validation
    if (securitySettings.passwordMinLength < 8) {
      setErrors(prev => ({ ...prev, passwordMinLength: "Minimum length must be at least 8 characters" }));
      return;
    }

    if (securitySettings.maxLoginAttempts < 1) {
      setErrors(prev => ({ ...prev, maxLoginAttempts: "Must allow at least 1 attempt" }));
      return;
    }

    if (securitySettings.lockoutDuration < 1) {
      setErrors(prev => ({ ...prev, lockoutDuration: "Duration must be at least 1 minute" }));
      return;
    }

    // Save settings logic here
    // In a real application, this would make an API call
  };

  const handleBlockIP = (ipAddress: string) => {
    setFailedLogins(failedLogins.map(login =>
      login.ipAddress === ipAddress
        ? { ...login, isBlocked: true }
        : login
    ));
  };

  const handleAddWhitelistIP = () => {
    if (!newWhitelistIP) {
      setErrors(prev => ({ ...prev, whitelistIP: "IP address is required" }));
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newWhitelistIP)) {
      setErrors(prev => ({ ...prev, whitelistIP: "Invalid IP address format" }));
      return;
    }

    if (securitySettings.whitelistedIPs.includes(newWhitelistIP)) {
      setErrors(prev => ({ ...prev, whitelistIP: "IP address already whitelisted" }));
      return;
    }

    setSecuritySettings(prev => ({
      ...prev,
      whitelistedIPs: [...prev.whitelistedIPs, newWhitelistIP],
    }));
    setNewWhitelistIP("");
    setErrors({});
  };

  const handleRemoveWhitelistIP = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      whitelistedIPs: prev.whitelistedIPs.filter(whitelistedIP => whitelistedIP !== ip),
    }));
  };

  const handleExportLogs = () => {
    const csvRows = [
      ['ID', 'User', 'Action', 'IP Address', 'Timestamp', 'Status'],
      ...activityLogs.map(log => [
        log.id,
        log.userName,
        log.action,
        log.ipAddress,
        format(log.timestamp, "PPp"),
        log.status,
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = activityLogs.filter(log =>
    (filterStatus === "all" || log.status === filterStatus) &&
    (log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.ipAddress.includes(searchTerm) ||
     log.action.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Security Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportLogs}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          <TabsList>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="failed">Failed Logins</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{format(log.timestamp, "PPp")}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            log.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {log.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedLog(log);
                              setIsViewLogDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-end items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => 
                    Math.min(Math.ceil(filteredLogs.length / itemsPerPage), prev + 1)
                  )}
                  disabled={currentPage === Math.ceil(filteredLogs.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="failed">
            <div className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedLogins.map(login => (
                      <TableRow key={login.id}>
                        <TableCell>{login.userName || "Unknown"}</TableCell>
                        <TableCell>{login.ipAddress}</TableCell>
                        <TableCell>{format(login.timestamp, "PPp")}</TableCell>
                        <TableCell>{login.reason}</TableCell>
                        <TableCell>
                          <span className={login.isBlocked ? "text-red-600" : "text-yellow-600"}>
                            {login.isBlocked ? "Blocked" : "Pending"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!login.isBlocked && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <BanIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Block IP Address</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to block this IP address?
                                    This will prevent any access from {login.ipAddress}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleBlockIP(login.ipAddress)}
                                  >
                                    Block IP
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password Requirements</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label>Minimum Length</label>
                    <Input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordMinLength: parseInt(e.target.value)
                      }))}
                      min={8}
                    />
                    {errors.passwordMinLength && (
                      <p className="text-sm text-red-500">{errors.passwordMinLength}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={securitySettings.requireSpecialChars}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireSpecialChars: checked as boolean
                        }))}
                      />
                      <label>Require Special Characters</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={securitySettings.requireNumbers}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireNumbers: checked as boolean
                        }))}
                      />
                      <label>Require Numbers</label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label>Maximum Failed Login Attempts</label>
                    <Input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        maxLoginAttempts: parseInt(e.target.value)
                      }))}
                      min={1}
                    />
                    {errors.maxLoginAttempts && (
                      <p className="text-sm text-red-500">{errors.maxLoginAttempts}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label>Lockout Duration (minutes)</label>
                    <Input
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        lockoutDuration: parseInt(e.target.value)
                      }))}
                      min={1}
                    />
                    {errors.lockoutDuration && (
                      <p className="text-sm text-red-500">{errors.lockoutDuration}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Session Management</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label>Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value)
                      }))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.allowMultipleSessions}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          allowMultipleSessions: checked
                        }))}
                      />
                      <label>Allow Multiple Sessions</label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.enable2FA}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({
                        ...prev,
                        enable2FA: checked
                      }))}
                    />
                    <label>Enable 2FA</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.require2FA}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({
                        ...prev,
                        require2FA: checked
                      }))}
                      disabled={!securitySettings.enable2FA}
                    />
                    <label>Require 2FA for All Users</label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IP Whitelist</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter IP address"
                      value={newWhitelistIP}
                      onChange={(e) => setNewWhitelistIP(e.target.value)}
                    />
                    <Button onClick={handleAddWhitelistIP}>Add IP</Button>
                  </div>
                  {errors.whitelistIP && (
                    <p className="text-sm text-red-500">{errors.whitelistIP}</p>
                  )}
                  <div className="space-y-2">
                    {securitySettings.whitelistedIPs.map(ip => (
                      <div key={ip} className="flex items-center justify-between p-2 border rounded">
                        <span>{ip}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveWhitelistIP(ip)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSecuritySettings(defaultSecuritySettings)}
                >
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={handleSettingsSave}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* View Log Dialog */}
      <Dialog open={isViewLogDialogOpen} onOpenChange={setIsViewLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Activity Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">User</label>
                <p>{selectedLog.userName}</p>
              </div>
              <div>
                <label className="font-semibold">Action</label>
                <p>{selectedLog.action}</p>
              </div>
              <div>
                <label className="font-semibold">IP Address</label>
                <p>{selectedLog.ipAddress}</p>
              </div>
              <div>
                <label className="font-semibold">Timestamp</label>
                <p>{format(selectedLog.timestamp, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p className={selectedLog.status === 'success' ? "text-green-600" : "text-red-600"}>
                  {selectedLog.status}
                </p>
              </div>
              <div>
                <label className="font-semibold">Details</label>
                <p className="whitespace-pre-wrap">{selectedLog.details}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewLogDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Security; 