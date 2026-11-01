import React, { useState, useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Dna,
  Search,
  RotateCcw,
  Loader2,
  BookOpen,
  ExternalLink,
  Sparkles,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface QuickTarget {
  label: string;
  gene: string;
  uniprotId: string;
  pdbId?: string;
  mode: 'alphafold' | 'pdb';
  description: string;
}

const QUICK_TARGETS: QuickTarget[] = [
  {
    label: 'TP53 · P04637',
    gene: 'TP53',
    uniprotId: 'P04637',
    mode: 'alphafold',
    description: 'Cellular tumor antigen p53 — Guardian of the human genome',
  },
  {
    label: 'INS · P01308',
    gene: 'INS',
    uniprotId: 'P01308',
    mode: 'alphafold',
    description: 'Human Insulin — Master metabolic hormone regulating glucose homeostasis',
  },
  {
    label: 'EGFR · P00533',
    gene: 'EGFR',
    uniprotId: 'P00533',
    mode: 'alphafold',
    description: 'Epidermal growth factor receptor tyrosine kinase',
  },
  {
    label: 'HBB · P68871',
    gene: 'HBB',
    uniprotId: 'P68871',
    mode: 'alphafold',
    description: 'Hemoglobin subunit beta — Oxygen transport metalloprotein',
  },
  {
    label: 'PDB 4HHB (Exp)',
    gene: 'HBA/HBB',
    uniprotId: 'P68871',
    pdbId: '4HHB',
    mode: 'pdb',
    description: 'Crystal structure of human deoxyhemoglobin at 1.74 Å resolution',
  },
];

interface BioMetadata {
  accession: string;
  geneName: string;
  proteinName: string;
  organism: string;
  sequence: string;
  length: number;
  functionText: string;
  sourceType: 'AlphaFold DB (Predicted)' | 'RCSB PDB (Experimental)';
  structureId: string;
  resolution?: string;
  experimentalMethod?: string;
  meanPlddt?: number;
  externalUrl: string;
}

export const BioscienceModule: React.FC = () => {
  const { saveLearningEntry, selectedDate, showIslandNotice } = useLifeOS();

  const [queryInput, setQueryInput] = useState('P04637');
  const [sourceMode, setSourceMode] = useState<'alphafold' | 'pdb'>('alphafold');
  const [renderStyle, setRenderStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'line'>(
    'cartoon'
  );
  const [colorScheme, setColorScheme] = useState<'plddt' | 'spectrum' | 'chain'>('plddt');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bioMeta, setBioMeta] = useState<BioMetadata | null>(null);
  const [selectedResidue, setSelectedResidue] = useState<number | null>(null);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const rawPdbTextRef = useRef<string>('');

  // Canonical AlphaFold 4-band pLDDT color function (stored in B-factor column)
  const applyViewerStyles = (
    viewer: any,
    styleMode: 'cartoon' | 'stick' | 'sphere' | 'line',
    scheme: 'plddt' | 'spectrum' | 'chain',
    highlightResi: number | null
  ) => {
    if (!viewer) return;
    viewer.setStyle({}, {});

    const colorfunc = (atom: any) => {
      const b = atom.b ?? 75;
      if (b > 90) return '#0053D6'; // Very high (pLDDT > 90)
      if (b >= 70) return '#65CBF3'; // Confident (70 <= pLDDT <= 90)
      if (b >= 50) return '#FFDB13'; // Low (50 <= pLDDT < 70)
      return '#FF7D45'; // Very low (pLDDT < 50)
    };

    const styleSpec: any = {};
    if (scheme === 'plddt') {
      styleSpec[styleMode] = { colorfunc };
    } else if (scheme === 'spectrum') {
      styleSpec[styleMode] = { color: 'spectrum' };
    } else {
      styleSpec[styleMode] = { colorscheme: 'chainHetatm' };
    }

    viewer.setStyle({}, styleSpec);

    if (highlightResi !== null) {
      viewer.addStyle(
        { resi: highlightResi },
        {
          stick: { radius: 0.3, colorscheme: 'GreenCarbon' },
          sphere: { radius: 0.6, color: '#10b981', opacity: 0.85 },
        }
      );
    }

    viewer.render();
  };

  const loadStructure = async (accessionOrPdb: string, mode: 'alphafold' | 'pdb') => {
    const cleanId = accessionOrPdb.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSelectedResidue(null);

    try {
      let pdbText = '';
      let meta: BioMetadata;

      if (mode === 'alphafold') {
        // 1. Fetch UniProtKB functional & sequence metadata
        const uniRes = await fetch(`https://rest.uniprot.org/uniprotkb/${cleanId}.json`);
        if (!uniRes.ok) {
          throw new Error(
            `UniProt accession "${cleanId}" not found. Try P04637 (TP53), P01308 (INS), or P00533 (EGFR).`
          );
        }
        const uniData = await uniRes.json();

        const geneName =
          uniData.genes?.[0]?.geneName?.value ||
          uniData.uniProtkbId ||
          cleanId;
        const proteinName =
          uniData.proteinDescription?.recommendedName?.fullName?.value ||
          uniData.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
          'Protein Structure';
        const organism = uniData.organism?.scientificName || 'Homo sapiens';
        const sequence = uniData.sequence?.value || '';
        const functionComment =
          uniData.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]
            ?.value || 'Involved in cellular signaling, structural regulation, and homeostasis.';

        // 2. Fetch AlphaFold DB prediction metadata to get exact PDB coordinate URL
        const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${cleanId}`);
        if (!afRes.ok) {
          throw new Error(
            `AlphaFold structure not found for ${cleanId}. Try switching to RCSB PDB or picking a quick-try target.`
          );
        }
        const afList = await afRes.json();
        const afEntry = Array.isArray(afList) ? afList[0] : afList;
        const pdbUrl =
          afEntry?.pdbUrl ||
          `https://alphafold.ebi.ac.uk/files/AF-${cleanId}-F1-model_v4.pdb`;

        const coordRes = await fetch(pdbUrl);
        if (!coordRes.ok) {
          throw new Error('Failed to download AlphaFold 3D coordinate file.');
        }
        pdbText = await coordRes.text();

        meta = {
          accession: cleanId,
          geneName,
          proteinName,
          organism,
          sequence,
          length: sequence.length || afEntry?.uniprotEnd || 0,
          functionText: functionComment,
          sourceType: 'AlphaFold DB (Predicted)',
          structureId: afEntry?.entryId || `AF-${cleanId}-F1`,
          meanPlddt: afEntry?.globalMetricValue,
          externalUrl: `https://alphafold.ebi.ac.uk/entry/${cleanId}`,
        };
        setColorScheme('plddt');
      } else {
        // Experimental RCSB PDB mode
        const pdbId = cleanId.slice(0, 4);
        const [entryRes, coordRes] = await Promise.all([
          fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`),
          fetch(`https://files.rcsb.org/download/${pdbId}.pdb`),
        ]);

        if (!coordRes.ok) {
          throw new Error(`RCSB PDB entry "${pdbId}" not found. Try 4HHB, 1TUP, or 1MBO.`);
        }
        pdbText = await coordRes.text();
        const entryData = entryRes.ok ? await entryRes.json() : {};

        const title =
          entryData?.struct?.title || `Experimental Macromolecular Structure ${pdbId}`;
        const method =
          entryData?.exptl?.[0]?.method || 'X-RAY DIFFRACTION';
        const resVal =
          entryData?.rcsb_entry_info?.resolution_combined?.[0]
            ? `${entryData.rcsb_entry_info.resolution_combined[0].toFixed(2)} Å`
            : 'High Resolution';

        meta = {
          accession: pdbId,
          geneName: pdbId,
          proteinName: title,
          organism: 'Experimental Crystal / Cryo-EM',
          sequence: '',
          length: entryData?.rcsb_entry_info?.deposited_polymer_monomer_count || 0,
          functionText: `Experimental structure resolved via ${method} (${resVal}).`,
          sourceType: 'RCSB PDB (Experimental)',
          structureId: pdbId,
          resolution: resVal,
          experimentalMethod: method,
          externalUrl: `https://www.rcsb.org/structure/${pdbId}`,
        };
        setColorScheme('spectrum');
      }

      rawPdbTextRef.current = pdbText;
      setBioMeta(meta);

      // Initialize or update 3Dmol viewer
      if (viewerContainerRef.current) {
        if (!viewerInstanceRef.current) {
          viewerInstanceRef.current = $3Dmol.createViewer(viewerContainerRef.current, {
            backgroundColor: '#090d16',
            antialias: true,
          });
        }
        const v = viewerInstanceRef.current;
        v.clear();
        v.addModel(pdbText, 'pdb');
        applyViewerStyles(
          v,
          renderStyle,
          mode === 'alphafold' ? 'plddt' : 'spectrum',
          null
        );
        v.zoomTo();
        v.render();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load biomolecular structure.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStructure('P04637', 'alphafold');
    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewerInstanceRef.current && rawPdbTextRef.current) {
      applyViewerStyles(viewerInstanceRef.current, renderStyle, colorScheme, selectedResidue);
    }
  }, [renderStyle, colorScheme, selectedResidue]);

  const handleToggleSpin = () => {
    const next = !isSpinning;
    setIsSpinning(next);
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.spin(next ? 'y' : false);
    }
  };

  const handleSelectResidue = (resi: number) => {
    setSelectedResidue(resi);
    if (viewerInstanceRef.current) {
      applyViewerStyles(viewerInstanceRef.current, renderStyle, colorScheme, resi);
      viewerInstanceRef.current.zoomTo({ resi });
      viewerInstanceRef.current.render();
    }
  };

  const handleLogToLearning = async () => {
    if (!bioMeta) return;
    await saveLearningEntry({
      id: `learn_bio_${Date.now()}`,
      date: selectedDate,
      category: 'technology',
      topic: `Structural Biology: ${bioMeta.geneName} (${bioMeta.structureId})`,
      notes: `${bioMeta.proteinName} [${bioMeta.sourceType}]. ${bioMeta.functionText.slice(0, 220)}`,
      durationMin: 30,
      completed: true,
      referenceUrl: bioMeta.externalUrl,
    });
    showIslandNotice('Logged to Learning', `${bioMeta.geneName} saved to Learning & Mastery`);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-cyan-500">
            Structural Bioinformatics & Genomics
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bioscience 3D Workbench
          </h1>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-500">
          3Dmol.js · AlphaFold · PDB
        </span>
      </div>

      {/* Quick-Try Canonical Targets */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick-Try Canonical Proteins
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_TARGETS.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                const targetId = t.mode === 'pdb' ? t.pdbId! : t.uniprotId;
                setSourceMode(t.mode);
                setQueryInput(targetId);
                loadStructure(targetId, t.mode);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:border-cyan-400 shrink-0 transition"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Database Mode Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-2.5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
          <button
            onClick={() => setSourceMode('alphafold')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              sourceMode === 'alphafold'
                ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            AlphaFold DB + UniProtKB
          </button>
          <button
            onClick={() => setSourceMode('pdb')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              sourceMode === 'pdb'
                ? 'bg-white dark:bg-[#151924] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            RCSB PDB (Experimental)
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadStructure(queryInput, sourceMode);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={
              sourceMode === 'alphafold'
                ? 'Enter UniProt ID (e.g. P04637, P01308, P38398)...'
                : 'Enter 4-char PDB ID (e.g. 4HHB, 1TUP, 1MBO)...'
            }
            className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono uppercase"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Fetch 3D</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 3Dmol.js Interactive Viewport */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-[#090d16] shadow-lg">
        {/* Viewer Top Status Bar */}
        <div className="px-3.5 py-2 bg-[#111726] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white">
              {bioMeta ? `${bioMeta.geneName} · ${bioMeta.structureId}` : 'Loading...'}
            </span>
          </div>
          {bioMeta && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                bioMeta.sourceType.includes('AlphaFold')
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {bioMeta.sourceType}
            </span>
          )}
        </div>

        {/* Isolated Relative Canvas Container */}
        <div className="relative w-full h-72 bg-[#090d16]">
          <div ref={viewerContainerRef} className="w-full h-full relative" />
          {isLoading && (
            <div className="absolute inset-0 bg-[#090d16]/80 flex flex-col items-center justify-center gap-2 text-cyan-400 text-xs z-20">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Parsing atomic coordinates & rendering WebGL mesh...</span>
            </div>
          )}
        </div>

        {/* Canonical 4-Band AlphaFold pLDDT Confidence Legend */}
        <div className="px-3.5 py-2 bg-[#0d121f] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            pLDDT Confidence:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0053D6] inline-block" />
              &gt;90 Very High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#65CBF3] inline-block" />
              70–90 Confident
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FFDB13] inline-block" />
              50–70 Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7D45] inline-block" />
              &lt;50 Disordered
            </span>
          </div>
        </div>

        {/* Representation & Camera Controls Toolbar */}
        <div className="p-2.5 bg-[#121829] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {(['cartoon', 'stick', 'sphere', 'line'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setRenderStyle(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                  renderStyle === st
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['plddt', 'spectrum', 'chain'] as const).map((cs) => (
              <button
                key={cs}
                onClick={() => setColorScheme(cs)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase transition ${
                  colorScheme === cs
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {cs}
              </button>
            ))}
            <button
              onClick={handleToggleSpin}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                isSpinning ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-300'
              }`}
            >
              Spin
            </button>
            <button
              onClick={() => {
                setSelectedResidue(null);
                viewerInstanceRef.current?.zoomTo();
                viewerInstanceRef.current?.render();
              }}
              className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
              title="Reset Camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Primary Sequence Strip */}
      {bioMeta && bioMeta.sequence && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Primary Amino Acid Sequence ({bioMeta.length} aa) — Tap residue to focus in 3D
            </span>
            {selectedResidue && (
              <span className="text-[11px] font-mono font-bold text-emerald-500">
                Focused: Residue #{selectedResidue} ({bioMeta.sequence[selectedResidue - 1]})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {bioMeta.sequence.slice(0, 120).split('').map((aa, idx) => {
              const resNum = idx + 1;
              const isSelected = selectedResidue === resNum;
              return (
                <button
                  key={resNum}
                  onClick={() => handleSelectResidue(resNum)}
                  className={`px-1.5 py-1 rounded text-[10px] font-mono shrink-0 transition ${
                    isSelected
                      ? 'bg-emerald-500 text-white font-bold scale-110'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-indigo-500/20'
                  }`}
                >
                  {aa}
                  <span className="text-[8px] opacity-60 ml-0.5">{resNum}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Curated Biological Metadata & Epistemic Provenance Card */}
      {bioMeta && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {bioMeta.proteinName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                {bioMeta.organism} · {bioMeta.length} residues
                {bioMeta.meanPlddt ? ` · Mean pLDDT: ${bioMeta.meanPlddt.toFixed(1)}` : ''}
              </p>
            </div>
            <a
              href={bioMeta.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 flex items-center gap-1 shrink-0"
            >
              <span>Source DB</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {bioMeta.functionText}
          </p>

          <button
            onClick={handleLogToLearning}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Save Study Record to Learning & Mastery</span>
          </button>
        </div>
      )}
    </div>
  );
};
