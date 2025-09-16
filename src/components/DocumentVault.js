import React from 'react';
import { FileText, FilePlus, Link, FileCheck, ClipboardCheck } from 'lucide-react';
import GlassCard from './GlassCard';

const DocumentVault = () => {
  // This would ideally be fetched from a backend or IPFS
  const documents = [
    {
      id: 1,
      title: 'Green Energy Project Technical Specifications',
      description: 'Detailed technical documentation of the solar farm project including panel specifications, installation details, and expected output.',
      type: 'technical',
      dateAdded: '2025-08-15',
      size: '2.4 MB',
      link: '#'
    },
    {
      id: 2,
      title: 'Environmental Impact Assessment Report',
      description: 'Comprehensive analysis of the environmental impact of the green energy project, including CO2 reduction projections.',
      type: 'environmental',
      dateAdded: '2025-08-10',
      size: '4.7 MB',
      link: '#'
    },
    {
      id: 3,
      title: 'Regulatory Compliance Documentation',
      description: 'All permits, certifications, and regulatory approvals for the green energy project operation.',
      type: 'legal',
      dateAdded: '2025-08-01',
      size: '1.2 MB',
      link: '#'
    },
    {
      id: 4,
      title: 'Smart Contract Audit Report',
      description: 'Security audit of the Green Bond smart contracts by an independent auditing firm.',
      type: 'technical',
      dateAdded: '2025-07-28',
      size: '3.1 MB',
      link: '#'
    },
    {
      id: 5,
      title: 'Financial Projections and ROI Analysis',
      description: 'Financial model of the project including expected returns, payment schedules, and risk assessment.',
      type: 'financial',
      dateAdded: '2025-07-25',
      size: '1.8 MB',
      link: '#'
    }
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'technical':
        return <FileText className="w-8 h-8 text-eco-blue" />;
      case 'environmental':
        return <ClipboardCheck className="w-8 h-8 text-eco-green" />;
      case 'legal':
        return <FileCheck className="w-8 h-8 text-eco-purple" />;
      case 'financial':
        return <FilePlus className="w-8 h-8 text-amber-400" />;
      default:
        return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-2xl font-montserrat font-bold text-white mb-6 flex items-center">
        <FileText className="mr-2 text-eco-green" />
        Document Vault
      </h2>
      
      <div className="space-y-4">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                {getIcon(doc.type)}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-montserrat font-semibold text-white">
                  {doc.title}
                </h3>
                <p className="text-white/70 text-sm font-inter mt-1">
                  {doc.description}
                </p>
                <div className="flex flex-wrap items-center mt-2 text-xs text-white/50 font-inter">
                  <span className="mr-3">Added: {doc.dateAdded}</span>
                  <span className="mr-3">Size: {doc.size}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    doc.type === 'technical' ? 'bg-blue-500/20 text-blue-200' :
                    doc.type === 'environmental' ? 'bg-green-500/20 text-green-200' :
                    doc.type === 'legal' ? 'bg-purple-500/20 text-purple-200' :
                    'bg-amber-500/20 text-amber-200'
                  }`}>
                    {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="w-full md:w-auto mt-4 md:mt-0">
                <a
                  href={doc.link}
                  className="flex items-center justify-center w-full md:w-auto bg-white/10 hover:bg-white/20 text-white font-montserrat font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  <Link className="mr-2 h-4 w-4" />
                  View Document
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-white/50 text-sm font-inter border-t border-white/10 pt-4">
        All documents are secured and verified on IPFS with cryptographic signatures.
      </div>
    </GlassCard>
  );
};

export default DocumentVault;