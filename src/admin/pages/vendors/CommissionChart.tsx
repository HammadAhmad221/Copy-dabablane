import { useState } from 'react';
import { Card } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/admin/components/ui/alert";

interface CommissionFile {
  id: string;
  fileName: string;
  uploadDate: Date;
  category: string;
  url: string;
}

const CommissionChart = () => {
  const [commissionFiles, setCommissionFiles] = useState<CommissionFile[]>([
    {
      id: "1",
      fileName: "Restaurant_Commission_2025.pdf",
      uploadDate: new Date(),
      category: "Restaurants",
      url: "#"
    },
    {
      id: "2",
      fileName: "Hotels_Commission_2025.pdf",
      uploadDate: new Date(),
      category: "Hotels",
      url: "#"
    }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Here you would typically upload the file to your server
      const newFile: CommissionFile = {
        id: String(commissionFiles.length + 1),
        fileName: file.name,
        uploadDate: new Date(),
        category: "New Category",
        url: URL.createObjectURL(file)
      };
      setCommissionFiles([...commissionFiles, newFile]);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    // In a real implementation, this would download the file from your server
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Commission Charts</h2>
              <p className="text-white/80 mt-1">Manage vendor commission charts and rates</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-white text-[#00897B] hover:bg-white/90">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Upload New Chart</span>
                  <Input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-6">

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {file.fileName}
                    </TableCell>
                    <TableCell>{file.category}</TableCell>
                    <TableCell>
                      {file.uploadDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.url, file.fileName)}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommissionChart;