import { useEffect, useState } from 'react';
import { Palette, Check, Eye } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const defaultScheme = {
  name: 'Default',
  primaryColor: '#f97316',
  darkColor: '#1a1a2e',
  background: '#ffffff',
  borderColor: '#e5e7eb',
  textColor: '#1f2937',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '8px',
};

export default function AdminSettings() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [activeScheme, setActiveScheme] = useState<any>(defaultScheme);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    Promise.all([
      adminAPI.getColorSchemes(),
      adminAPI.getSettings(),
    ])
      .then(([schemesRes, settingsRes]) => {
        setSchemes(schemesRes.data.schemes || []);
        const saved = settingsRes.data.settings?.color_scheme;
        if (saved) setActiveScheme(saved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (scheme: any) => {
    setApplying(true);
    try {
      await adminAPI.updateSettings('color_scheme', scheme);
      setActiveScheme(scheme);
      toast.success(`Applied "${scheme.name}" color scheme`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply scheme');
    } finally {
      setApplying(false);
    }
  };

  const isActive = (scheme: any) => activeScheme?.name === scheme.name;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-eb-dark mb-6">Settings</h1>

      <div className="bg-white border border-eb-gray-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-eb-orange" />
          <h2 className="text-xl font-bold">Color Schemes</h2>
        </div>
        <p className="text-sm text-eb-gray mb-6">Choose a color scheme to customize the look and feel of the application.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {schemes.map((scheme, i) => (
            <div
              key={i}
              onClick={() => handleApply(scheme)}
              className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                isActive(scheme) ? 'border-eb-orange ring-2 ring-eb-orange/20' : 'border-eb-gray-border hover:border-eb-gray'
              } ${applying ? 'pointer-events-none opacity-70' : ''}`}
            >
              {isActive(scheme) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-eb-orange rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <p className="font-semibold text-sm mb-3">{scheme.name}</p>
              <div className="flex gap-1.5 mb-3">
                <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: scheme.primaryColor }} />
                <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: scheme.darkColor }} />
                <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: scheme.background }} />
              </div>
              <div className="space-y-1 text-xs text-eb-gray">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scheme.borderColor }} />
                  Border
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scheme.textColor }} />
                  Text
                </p>
                <p>Font: {scheme.fontFamily?.split(',')[0] || 'Default'}</p>
                <p>Radius: {scheme.borderRadius}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-eb-gray-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-eb-gray" />
            <h3 className="font-bold">Preview</h3>
          </div>
          <div
            className="rounded-xl p-6 space-y-4"
            style={{
              backgroundColor: activeScheme.background || '#ffffff',
              border: `1px solid ${activeScheme.borderColor || '#e5e7eb'}`,
              fontFamily: activeScheme.fontFamily || 'Inter, sans-serif',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 rounded-md text-white font-semibold text-sm"
                style={{
                  backgroundColor: activeScheme.primaryColor || '#f97316',
                  borderRadius: activeScheme.borderRadius || '8px',
                }}
              >
                Sample Button
              </button>
              <button
                className="px-5 py-2.5 rounded-md text-sm font-semibold"
                style={{
                  border: `2px solid ${activeScheme.primaryColor || '#f97316'}`,
                  color: activeScheme.primaryColor || '#f97316',
                  borderRadius: activeScheme.borderRadius || '8px',
                }}
              >
                Outline Button
              </button>
            </div>

            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: activeScheme.background === '#ffffff' ? '#f9fafb' : '#ffffff',
                border: `1px solid ${activeScheme.borderColor || '#e5e7eb'}`,
                borderRadius: activeScheme.borderRadius || '8px',
              }}
            >
              <p className="font-semibold text-base mb-1" style={{ color: activeScheme.textColor || '#1f2937' }}>
                Sample Card Title
              </p>
              <p className="text-sm" style={{ color: activeScheme.textColor || '#1f2937', opacity: 0.7 }}>
                This is a preview of how content cards will look with this color scheme applied.
              </p>
              <div className="mt-3 flex gap-2">
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${activeScheme.primaryColor}15`,
                    color: activeScheme.primaryColor,
                    borderRadius: activeScheme.borderRadius,
                  }}
                >
                  Tag
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: activeScheme.textColor || '#1f2937',
                    borderRadius: activeScheme.borderRadius,
                  }}
                >
                  Another Tag
                </span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Sample input field..."
              className="w-full px-4 py-3 text-sm"
              style={{
                border: `1px solid ${activeScheme.borderColor || '#e5e7eb'}`,
                borderRadius: activeScheme.borderRadius || '8px',
                color: activeScheme.textColor || '#1f2937',
                backgroundColor: activeScheme.background || '#ffffff',
              }}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
