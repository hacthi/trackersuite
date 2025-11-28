import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  BarChart3,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Export() {
  const [exportType, setExportType] = useState<string>("");
  const [format, setFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const [clientFields, setClientFields] = useState({
    name: true,
    email: true,
    phone: true,
    company: true,
    status: true,
    notes: false,
    createdAt: false,
    updatedAt: false,
  });

  const [followUpFields, setFollowUpFields] = useState({
    title: true,
    client: true,
    dueDate: true,
    status: true,
    description: false,
    createdAt: false,
    completedAt: false,
  });

  const handleExport = async () => {
    if (!exportType) {
      toast({
        title: "Error",
        description: "Please select an export type",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const endpoint = exportType === "clients" ? "/api/export/clients" : "/api/export/follow-ups";
      const response = await fetch(`${endpoint}?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle CSV download
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Success",
        description: `${exportType} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      id: "clients",
      name: "Client Data",
      description: "Export all client information including contact details and status",
      icon: Users,
      fields: clientFields,
      setFields: setClientFields,
    },
    {
      id: "follow-ups",
      name: "Follow-up Data",
      description: "Export follow-up tasks with client associations and status",
      icon: Calendar,
      fields: followUpFields,
      setFields: setFollowUpFields,
    },
  ];

  const currentOption = exportOptions.find(opt => opt.id === exportType);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Export Data</h2>
              <p className="text-gray-600">Download your client and follow-up data</p>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Data Export</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Export Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Select Export Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {exportOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Card 
                        key={option.id}
                        className={`cursor-pointer transition-all ${
                          exportType === option.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setExportType(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              exportType === option.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                exportType === option.id ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{option.name}</h3>
                              <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Format Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                      <SelectItem value="json">JSON (JavaScript Object)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    {format === 'csv' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Excel Compatible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Developer Friendly
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Selection */}
            {currentOption && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Fields to Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {Object.entries(currentOption.fields).map(([field, checked]) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={checked}
                          onCheckedChange={(checked) => {
                            currentOption.setFields(prev => ({
                              ...prev,
                              [field]: checked === true
                            }));
                          }}
                        />
                        <Label 
                          htmlFor={field} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                        >
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Preview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Ready to export:</p>
                      <p className="text-sm text-gray-600">
                        {exportType ? `${currentOption?.name} in ${format.toUpperCase()} format` : 'Please select an export type'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {exportType ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {currentOption && (
                    <div className="text-sm text-gray-600">
                      <p>Selected fields: {Object.entries(currentOption.fields).filter(([_, checked]) => checked).length}</p>
                      <p>File format: {format.toUpperCase()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                    <p className="text-sm text-gray-600">
                      Download will start automatically when ready
                    </p>
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={!exportType || isExporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Tips */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Export Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>JSON files are perfect for importing into other applications or databases</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>All exports include data from the current system state</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Select only the fields you need to keep file sizes smaller</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
