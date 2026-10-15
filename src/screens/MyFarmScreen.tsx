import React, { useState } from 'react';
import { 
  Sprout, 
  Plus, 
  Edit3, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Stethoscope, 
  MapPin, 
  Layers, 
  X,
  FileText
} from 'lucide-react';
import { 
  CropRecord, 
  FarmerProfile, 
  FarmObservation, 
  SoilScanRecord, 
  GrowthStage, 
  SoilType, 
  SupportedLanguage 
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';

interface MyFarmScreenProps {
  profile: FarmerProfile;
  crops: CropRecord[];
  observations: FarmObservation[];
  soilScans: SoilScanRecord[];
  onUpdateProfile: (profile: FarmerProfile) => void;
  onRefreshData: () => void;
  onOpenFertilizerWithCrop: (cropName: string) => void;
  language: SupportedLanguage;
}

const GROWTH_STAGES: GrowthStage[] = [
  'Sowing / Germination',
  'Tillering / Vegetative',
  'Flowering / Booting',
  'Grain / Fruit Formation',
  'Ripening / Maturity',
  'Harvest Ready',
];

const SOIL_TYPES: SoilType[] = [
  'Alluvial Soil',
  'Black Soil (Regur)',
  'Red and Yellow Soil',
  'Laterite Soil',
  'Sandy Loam',
  'Clay Loam',
  'Mountain / Forest Soil',
];

export const MyFarmScreen: React.FC<MyFarmScreenProps> = ({
  profile,
  crops,
  observations,
  soilScans,
  onUpdateProfile,
  onRefreshData,
  onOpenFertilizerWithCrop,
  language,
}) => {
  const t = TRANSLATIONS[language]?.myFarm || TRANSLATIONS.en.myFarm;

  const [activeSubTab, setActiveSubTab] = useState<'crops' | 'observations' | 'soilTests'>('crops');
  
  // Safe item deletion state (modal-based)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'crop' | 'observation'; id: string; name: string } | null>(null);
  
  // Farm Profile Edit Modal
  const [isEditingFarm, setIsEditingFarm] = useState<boolean>(false);
  const [farmName, setFarmName] = useState<string>(profile.farmName);
  const [farmLocation, setFarmLocation] = useState<string>(profile.villageOrDistrict);
  const [farmState, setFarmState] = useState<string>(profile.state);
  const [farmArea, setFarmArea] = useState<number>(profile.totalFarmArea);
  const [primarySoil, setPrimarySoil] = useState<SoilType>(profile.primarySoilType);

  // Add/Edit Crop Modal
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [cropFormName, setCropFormName] = useState<string>('');
  const [cropFormVariety, setCropFormVariety] = useState<string>('');
  const [cropFormField, setCropFormField] = useState<string>('Plot 1');
  const [cropFormArea, setCropFormArea] = useState<number>(2.0);
  const [cropFormSowingDate, setCropFormSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cropFormStage, setCropFormStage] = useState<GrowthStage>('Tillering / Vegetative');
  const [cropFormHarvestDate, setCropFormHarvestDate] = useState<string>('');
  const [cropFormSoil, setCropFormSoil] = useState<SoilType>(profile.primarySoilType);
  const [cropFormNotes, setCropFormNotes] = useState<string>('');
  const [cropFormHealth, setCropFormHealth] = useState<'healthy' | 'attention' | 'critical'>('healthy');

  // Add Observation Modal
  const [isObsModalOpen, setIsObsModalOpen] = useState<boolean>(false);
  const [obsDate, setObsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [obsCrop, setObsCrop] = useState<string>('');
  const [obsField, setObsField] = useState<string>('Main Plot');
  const [obsCategory, setObsCategory] = useState<FarmObservation['category']>('General');
  const [obsNotes, setObsNotes] = useState<string>('');

  // Handle Save Farm Profile
  const handleSaveFarmProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      farmName: farmName.trim() || 'My Farm',
      villageOrDistrict: farmLocation.trim(),
      state: farmState.trim(),
      totalFarmArea: Number(farmArea) || 1,
      primarySoilType: primarySoil,
    };
    storageService.saveProfile(updated);
    onUpdateProfile(updated);
    setIsEditingFarm(false);
  };

  // Open Crop Modal for Create or Edit
  const handleOpenAddCrop = () => {
    setEditingCropId(null);
    setCropFormName('');
    setCropFormVariety('');
    setCropFormField('Plot A');
    setCropFormArea(2.0);
    setCropFormSowingDate(new Date().toISOString().split('T')[0]);
    setCropFormStage('Tillering / Vegetative');
    setCropFormHarvestDate('');
    setCropFormSoil(profile.primarySoilType);
    setCropFormNotes('');
    setCropFormHealth('healthy');
    setIsCropModalOpen(true);
  };

  const handleOpenEditCrop = (crop: CropRecord) => {
    setEditingCropId(crop.id);
    setCropFormName(crop.name);
    setCropFormVariety(crop.variety);
    setCropFormField(crop.fieldName);
    setCropFormArea(crop.area);
    setCropFormSowingDate(crop.sowingDate);
    setCropFormStage(crop.currentStage);
    setCropFormHarvestDate(crop.estimatedHarvestDate);
    setCropFormSoil(crop.soilType);
    setCropFormNotes(crop.notes);
    setCropFormHealth(crop.healthStatus);
    setIsCropModalOpen(true);
  };

  const handleSaveCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropFormName.trim()) return;

    const newCrop: CropRecord = {
      id: editingCropId || `crop-${Date.now()}`,
      name: cropFormName.trim(),
      variety: cropFormVariety.trim() || 'Standard',
      fieldName: cropFormField.trim() || 'Main Plot',
      area: Number(cropFormArea) || 1,
      areaUnit: profile.preferredAreaUnit,
      sowingDate: cropFormSowingDate,
      currentStage: cropFormStage,
      estimatedHarvestDate: cropFormHarvestDate || 'TBD',
      soilType: cropFormSoil,
      notes: cropFormNotes.trim(),
      healthStatus: cropFormHealth,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveCrop(newCrop);
    setIsCropModalOpen(false);
    onRefreshData();
  };

  const handleDeleteCrop = (id: string, name: string) => {
    setItemToDelete({ type: 'crop', id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'crop') {
        await storageService.deleteCrop(itemToDelete.id);
      } else {
        await storageService.deleteObservation(itemToDelete.id);
      }
    } catch (e) {
      console.error('Delete item failed:', e);
    } finally {
      setItemToDelete(null);
      onRefreshData();
    }
  };

  // Handle Save Observation
  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsNotes.trim()) return;

    const newObs: FarmObservation = {
      id: `obs-${Date.now()}`,
      date: obsDate,
      cropName: obsCrop.trim() || undefined,
      fieldName: obsField.trim() || 'Main Plot',
      category: obsCategory,
      notes: obsNotes.trim(),
    };

    storageService.saveObservation(newObs);
    setIsObsModalOpen(false);
    setObsNotes('');
    onRefreshData();
  };

  const handleDeleteObservation = (id: string, name: string) => {
    setItemToDelete({ type: 'observation', id, name });
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Farm Overview Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#edf3ea]">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              <h1 className="text-xl font-black text-[#113d23] font-display">
                {profile.farmName || 'My Farm'}
              </h1>
            </div>
            <p className="text-xs text-[#526d57] mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{profile.villageOrDistrict || 'Vijayapura'}, {profile.state || 'Karnataka'}</span>
              <span>•</span>
              <span>{profile.totalFarmArea} {profile.preferredAreaUnit}</span>
              <span>•</span>
              <span>{profile.primarySoilType}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setFarmName(profile.farmName);
              setFarmLocation(profile.villageOrDistrict);
              setFarmState(profile.state);
              setFarmArea(profile.totalFarmArea);
              setPrimarySoil(profile.primarySoilType);
              setIsEditingFarm(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-[#edf5eb] border border-[#cfe2cb] text-xs font-bold text-[#14492a] hover:bg-[#e2edd0] transition self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editFarm}</span>
          </button>
        </div>

        {/* Local Storage Privacy Notice */}
        <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data stored securely on your browser device (₹0 Budget)</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">Active</span>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-1 p-1 bg-[#ebf3e7] rounded-2xl border border-[#d6e7d1]">
        <button
          onClick={() => setActiveSubTab('crops')}
          className={`flex-1 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition text-center min-h-[40px] flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
            activeSubTab === 'crops'
              ? 'bg-white text-[#113d23] shadow-xs'
              : 'text-[#4c6752] hover:text-[#113d23]'
          }`}
        >
          <Sprout className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.activeCropsTab} ({crops.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('observations')}
          className={`flex-1 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition text-center min-h-[40px] flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
            activeSubTab === 'observations'
              ? 'bg-white text-[#113d23] shadow-xs'
              : 'text-[#4c6752] hover:text-[#113d23]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.observationsTab} ({observations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('soilTests')}
          className={`flex-1 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition text-center min-h-[40px] flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
            activeSubTab === 'soilTests'
              ? 'bg-white text-[#113d23] shadow-xs'
              : 'text-[#4c6752] hover:text-[#113d23]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.soilTestsTab} ({soilScans.length})</span>
        </button>
      </div>

      {/* Tab 1: Crops Management */}
      {activeSubTab === 'crops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#144225] font-display">
                Registered Field Plots
              </h2>
              <p className="text-xs text-slate-500">Track sowing dates, crop stages & soil conditions</p>
            </div>

            <button
              onClick={handleOpenAddCrop}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addCrop}</span>
            </button>
          </div>

          {crops.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-8 border border-dashed border-[#cfe2ca] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#edf5eb] flex items-center justify-center mx-auto text-emerald-800">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#113d23]">{t.emptyCropsTitle}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.emptyCropsDesc}</p>
              </div>
              <button
                onClick={handleOpenAddCrop}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Crop</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {crops.map((crop) => {
                const stageIndex = GROWTH_STAGES.indexOf(crop.currentStage);
                const progressPct = Math.round(((stageIndex + 1) / GROWTH_STAGES.length) * 100);

                return (
                  <div
                    key={crop.id}
                    className="bg-white rounded-2xl border border-[#dce8d5] p-4 space-y-3.5 shadow-2xs hover:border-[#b0d8a8] transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#113d23]">
                            {crop.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            crop.healthStatus === 'healthy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {crop.healthStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#526d57]">
                          {crop.variety} • {crop.area} {crop.areaUnit} ({crop.fieldName})
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditCrop(crop)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#edf5eb] transition"
                          title="Edit Crop"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCrop(crop.id, crop.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Crop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Growth Stage Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#144225]">{t.growthStage}:</span>
                        <span className="font-bold text-emerald-800">{crop.currentStage}</span>
                      </div>
                      <div className="w-full bg-[#ebf3e7] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-green-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline Data */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8faf6] p-2.5 rounded-xl border border-[#edf3ea]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.sowingDate}</span>
                          <span className="font-semibold text-slate-700">{crop.sowingDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.harvestEst}</span>
                          <span className="font-semibold text-slate-700">{crop.estimatedHarvestDate || 'TBD'}</span>
                        </div>
                      </div>
                    </div>

                    {crop.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{crop.notes}"
                      </p>
                    )}

                    {/* Quick Context Action: Fertilizer Guidance */}
                    <div className="pt-1 border-t border-[#edf3ea]">
                      <button
                        onClick={() => onOpenFertilizerWithCrop(crop.name)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 min-h-[40px] rounded-xl bg-[#edf5eb] hover:bg-[#e1eedc] text-[#14492a] text-xs font-bold transition min-w-0"
                        title={t.fertilizerGuidance}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="truncate">{t.fertilizerGuidance}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Field Observations & Notes */}
      {activeSubTab === 'observations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#144225] font-display">
                Field Observations & Farming Notes
              </h2>
              <p className="text-xs text-slate-500">Record irrigation, weeding, pests, and daily logs</p>
            </div>

            <button
              onClick={() => setIsObsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addObservation}</span>
            </button>
          </div>

          {observations.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-[#cfe2ca] text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No field observations recorded</h3>
              <p className="text-xs text-slate-500">Log irrigation days, fertilizer applications, and pest sightings.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-white rounded-2xl border border-[#dce8d5] p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:bg-[#fafcf9] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#edf5eb] text-[#14492a] border border-[#cfe2cb]">
                        {obs.category}
                      </span>
                      <span className="text-xs text-slate-400">{obs.date}</span>
                      {obs.cropName && (
                        <span className="text-xs font-semibold text-slate-700">
                          • {obs.cropName}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">({obs.fieldName})</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-normal">
                      {obs.notes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteObservation(obs.id, `${obs.cropName ? `${obs.cropName} - ` : ''}${obs.category} observation`)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition shrink-0"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Soil Tests */}
      {activeSubTab === 'soilTests' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#144225] font-display">
              Saved Soil-Test Records
            </h2>
            <p className="text-xs text-slate-500">Laboratory Soil Health Cards & Field Scans</p>
          </div>

          {soilScans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-[#cfe2ca] text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No soil test reports saved</h3>
              <p className="text-xs text-slate-500">Use the Soil Scan tab to record field photographs and laboratory NPK values.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {soilScans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-white rounded-2xl border border-[#dce8d5] p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      {scan.soilPhotoUrl && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-[#cfe2ca] shrink-0">
                          <img src={scan.soilPhotoUrl} alt="Soil thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-[#113d23]">
                          {scan.fieldName} • {scan.knownSoilType}
                        </h4>
                        <p className="text-[11px] text-slate-500">Recorded on {scan.date}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      scan.isAiAnalyzed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : scan.isLabVerified
                        ? 'bg-blue-50 text-blue-800 border border-blue-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {scan.isAiAnalyzed ? 'AI Vision Scan' : scan.isLabVerified ? 'Lab Verified' : 'Farmer Field Record'}
                    </span>
                  </div>

                  {scan.labResults && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">pH Level</span>
                        <span className="font-extrabold text-slate-800 tabular-nums">{scan.labResults.pH ?? 'N/A'}</span>
                      </div>
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">Nitrogen (N)</span>
                        <span className="font-extrabold text-slate-800 tabular-nums">{scan.labResults.nitrogenKgHa ? `${scan.labResults.nitrogenKgHa} kg/ha` : 'N/A'}</span>
                      </div>
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">Phosphorus (P)</span>
                        <span className="font-extrabold text-slate-800 tabular-nums">{scan.labResults.phosphorusKgHa ? `${scan.labResults.phosphorusKgHa} kg/ha` : 'N/A'}</span>
                      </div>
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">Potassium (K)</span>
                        <span className="font-extrabold text-slate-800 tabular-nums">{scan.labResults.potassiumKgHa ? `${scan.labResults.potassiumKgHa} kg/ha` : 'N/A'}</span>
                      </div>
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">Moisture</span>
                        <span className="font-semibold text-slate-800">{scan.soilMoisture}</span>
                      </div>
                      <div className="bg-[#f7faf5] p-2 rounded-xl border border-[#dbe7d5]">
                        <span className="text-[10px] text-slate-400 block font-bold">Drainage</span>
                        <span className="font-semibold text-slate-800">{scan.fieldDrainage}</span>
                      </div>
                    </div>
                  )}

                  {scan.observations && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Observation:</strong> {scan.observations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Edit Farm Info */}
      {isEditingFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#144225] font-display">Edit Farm Details</h3>
              <button
                onClick={() => setIsEditingFarm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Village / District
                  </label>
                  <input
                    type="text"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    State
                  </label>
                  <input
                    type="text"
                    value={farmState}
                    onChange={(e) => setFarmState(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Total Area ({profile.preferredAreaUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={farmArea}
                    onChange={(e) => setFarmArea(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Primary Soil Type
                  </label>
                  <select
                    value={primarySoil}
                    onChange={(e) => setPrimarySoil(e.target.value as SoilType)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SOIL_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingFarm(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Crop */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#144225] font-display">
                {editingCropId ? 'Edit Crop Record' : 'Register New Crop'}
              </h3>
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCrop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Crop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cropFormName}
                  onChange={(e) => setCropFormName(e.target.value)}
                  placeholder="E.g., Wheat, Tomato, Red Onion, Cotton..."
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={cropFormVariety}
                    onChange={(e) => setCropFormVariety(e.target.value)}
                    placeholder="E.g., HD-2967, Desi, F1 Hybrid..."
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Field / Plot Name
                  </label>
                  <input
                    type="text"
                    value={cropFormField}
                    onChange={(e) => setCropFormField(e.target.value)}
                    placeholder="E.g., Canal Plot, Ridge B..."
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Plot Area ({profile.preferredAreaUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropFormArea}
                    onChange={(e) => setCropFormArea(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Soil Type
                  </label>
                  <select
                    value={cropFormSoil}
                    onChange={(e) => setCropFormSoil(e.target.value as SoilType)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SOIL_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    value={cropFormSowingDate}
                    onChange={(e) => setCropFormSowingDate(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Expected Harvest
                  </label>
                  <input
                    type="date"
                    value={cropFormHarvestDate}
                    onChange={(e) => setCropFormHarvestDate(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Growth Stage
                  </label>
                  <select
                    value={cropFormStage}
                    onChange={(e) => setCropFormStage(e.target.value as GrowthStage)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GROWTH_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Health Status
                  </label>
                  <select
                    value={cropFormHealth}
                    onChange={(e) => setCropFormHealth(e.target.value as any)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="healthy">Healthy (Normal)</option>
                    <option value="attention">Needs Attention</option>
                    <option value="critical">Critical / Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Field Notes & Observations
                </label>
                <textarea
                  value={cropFormNotes}
                  onChange={(e) => setCropFormNotes(e.target.value)}
                  placeholder="E.g., Drip irrigation set up, second weeding planned next week..."
                  rows={2}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition"
                >
                  {editingCropId ? 'Save Crop Changes' : 'Register Crop'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Field Observation */}
      {isObsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#144225] font-display">Record Field Observation</h3>
              <button
                onClick={() => setIsObsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={obsDate}
                    onChange={(e) => setObsDate(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={obsCategory}
                    onChange={(e) => setObsCategory(e.target.value as any)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Irrigation">Irrigation</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Pest & Disease">Pest & Disease</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Weather">Weather Event</option>
                    <option value="General">General Note</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Related Crop
                  </label>
                  <input
                    type="text"
                    value={obsCrop}
                    onChange={(e) => setObsCrop(e.target.value)}
                    placeholder="E.g., Wheat, All plots"
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Plot / Location
                  </label>
                  <input
                    type="text"
                    value={obsField}
                    onChange={(e) => setObsField(e.target.value)}
                    placeholder="E.g., Canal Plot A"
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Observation Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={obsNotes}
                  onChange={(e) => setObsNotes(e.target.value)}
                  placeholder="E.g., Applied canal water for 4 hours. Soil absorbed well with minimal pooling..."
                  rows={3}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition"
                >
                  Save Observation
                </button>
                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe In-App Deletion Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                Delete {itemToDelete.type === 'crop' ? 'Crop' : 'Observation'} Record?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-700">{itemToDelete.name}</strong>? This record will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
