import React, { useState, ChangeEvent, FormEvent } from 'react';
import './App.css';
import { MousePointer2 } from 'lucide-react';
import { generateComicPanel, ImageConfig } from './services/gemini';
import { TINTIN_SYSTEM_PROMPT, buildPanelPrompt, TEST_PROMPTS, PanelConfig } from './prompts/tintin';
import logo from './assets/nanocomics.jpeg';

interface Panel {
  id: string;
}

interface Row {
  id: string;
  panels: Panel[];
}

interface SelectedPanel {
  rowId: string;
  panelId: string;
  aspectRatio: string;
  width: number;
  height: number;
}

interface PanelData {
  [key: string]: PanelConfig & { imageUrl?: string };
}

const INITIAL_ROWS: Row[] = [
  { id: 'r1', panels: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }] },
  { id: 'r2', panels: [{ id: 'p4' }, { id: 'p5' }] },
  { id: 'r3', panels: [{ id: 'p6' }] },
];

function App() {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [generatingPanel, setGeneratingPanel] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<PanelData>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [speechOverlay, setSpeechOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestPrompt, setSelectedTestPrompt] = useState(-1);

  const getClosestAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const standardRatios = [
      { name: '1:1', value: 1 },
      { name: '4:3', value: 4/3 },
      { name: '3:4', value: 3/4 },
      { name: '16:9', value: 16/9 },
      { name: '9:16', value: 9/16 },
      { name: '2:3', value: 2/3 },
      { name: '3:2', value: 3/2 },
    ];
    
    return standardRatios.reduce((prev, curr) => 
      Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev
    ).name;
  };

  const handlePanelClick = (rowId: string, panelId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const aspectRatio = getClosestAspectRatio(rect.width, rect.height);
    
    setSelectedPanel({ 
      rowId, 
      panelId, 
      aspectRatio,
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
    setIsConfigOpen(true);
    setError(null);
  };

  const handleTestPromptSelect = (index: number) => {
    setSelectedTestPrompt(index);
  };

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPanel) return;

    const formData = new FormData(e.currentTarget);
    let config: PanelConfig;

    const currentAspectRatio = selectedPanel.aspectRatio;

    if (selectedTestPrompt >= 0) {
      config = { 
        ...TEST_PROMPTS[selectedTestPrompt].config,
        dimensions: currentAspectRatio 
      };
    } else {
      config = {
        content: formData.get('content') as string,
        characters: formData.get('characters') as string,
        setting: formData.get('setting') as string,
        mood: formData.get('mood') as string,
        dialogue: speechOverlay ? (formData.get('dialogue') as string) : '',
        cameraAngle: formData.get('cameraAngle') as string,
        params: formData.get('params') as string,
        dimensions: currentAspectRatio
      };
    }

    const panelId = selectedPanel.panelId;
    setIsConfigOpen(false);
    setSelectedPanel(null);
    setGeneratingPanel(panelId);
    setError(null);

    try {
      const prompt = buildPanelPrompt(config);
      
      const imageConfig: ImageConfig = {
        aspectRatio: currentAspectRatio,
        imageSize: '1024'
      };

      const result = await generateComicPanel(prompt, TINTIN_SYSTEM_PROMPT, imageConfig);

      setPanelData(prev => ({
        ...prev,
        [panelId]: { ...config, imageUrl: result.imageUrl }
      }));
    } catch (err: any) {
      console.error('❌ Generation failed:', err);
      setError(`Panel generation failed: ${err.message}`);
    } finally {
      setGeneratingPanel(null);
      setSelectedTestPrompt(-1);
    }
  };

  const addRow = () => {
    if (rows.length >= 4) return;
    const newId = `r${rows.length + 1}-${Date.now()}`;
    setRows([...rows, { id: newId, panels: [{ id: `p${Date.now()}` }] }]);
  };

  const addPanelToRow = (rowId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId && row.panels.length < 3) {
        return { ...row, panels: [...row.panels, { id: `p${Date.now()}` }] };
      }
      return row;
    }));
  };

  const removePanelFromRow = (rowId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId && row.panels.length > 1) {
        return { ...row, panels: row.panels.slice(0, -1) };
      }
      return row;
    }));
  };

  const closeConfig = () => {
    setIsConfigOpen(false);
    setSelectedPanel(null);
    setError(null);
    setSelectedTestPrompt(-1);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="header">
          <img src={logo} alt="NANO COMICS" className="header-logo" />
        </header>

        <div className="info-section">
          DESIGN YOUR COMIC BOOK ARCHITECTURE.<br />
          EACH PANEL IS POWERED BY NANO BANANA.
        </div>

        <div className="controls-section">
          <div className="control-group">
            <h3>Page Navigator</h3>
            <div className="btn-stack" style={{ flexDirection: 'row', gap: '8px' }}>
              {[1, 2, 3].map(p => (
                <button 
                  key={p} 
                  className={`btn ${currentPage === p ? 'btn-primary' : ''}`}
                  onClick={() => setCurrentPage(p)}
                  style={{ flex: 1, padding: '8px' }}
                >
                  0{p}
                </button>
              ))}
              <button className="btn" style={{ flex: 1, padding: '8px' }}>+</button>
            </div>
          </div>

          <div className="control-group">
            <h3>Layout Engine</h3>
            <button className="btn btn-primary" onClick={addRow}>
              + ADD NEW ROW
            </button>
          </div>

          <div className="control-group">
            <h3>Row Configuration</h3>
            <div className="btn-stack" style={{ maxHeight: '25vh', overflowY: 'auto', paddingRight: '4px' }}>
              {rows.map((row, idx) => (
                <div key={`row-ctrl-${row.id}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: '0.7rem', minWidth: '24px', color: '#555' }}>R{idx+1}</span>
                  <button 
                    className="btn" 
                    onClick={() => addPanelToRow(row.id)} 
                    style={{ padding: '8px' }}
                    disabled={row.panels.length >= 3}
                  >
                    + PANEL
                  </button>
                  <button className="btn" onClick={() => removePanelFromRow(row.id)} disabled={row.panels.length <= 1} style={{ padding: '8px', width: '40px' }}>
                    -
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="control-group" style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button className="btn" onClick={() => window.print()}>
              GENERATE PDF
            </button>
            <button className="btn" onClick={() => setPanelData({})}>
              RESET CANVAS
            </button>
          </div>
        </div>
      </aside>

      <main className="viewer">
        <div className={`viewer-content ${isConfigOpen ? 'shifted' : ''}`}>
          <div className="comic-page">
            {rows.map((row) => (
              <div key={row.id} className="comic-row">
                {row.panels.map((panel) => {
                  const data = panelData[panel.id];
                  const isGenerating = generatingPanel === panel.id;
                  const isSelected = selectedPanel?.panelId === panel.id;
                  
                  return (
                    <div 
                      key={panel.id} 
                      className={`comic-panel ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => handlePanelClick(row.id, panel.id, e)}
                    >
                      {isSelected && (
                        <div className="selected-status">
                          <MousePointer2 size={16} strokeWidth={3} />
                          <span className="mono">SELECTED</span>
                        </div>
                      )}
                      {isGenerating ? (
                        <div className="generating-state">
                          <div className="loading-spinner"></div>
                          <span className="mono generating-text">GENERATING...</span>
                        </div>
                      ) : data?.imageUrl ? (
                        <img src={data.imageUrl} alt="Generated Panel" className="panel-image" />
                      ) : (
                        <div className="panel-placeholder">
                          <span className="plus">+</span>
                          <span className="mono">GENERATE</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-toast" onClick={() => setError(null)}>
            <span>⚠ {error}</span>
            <button className="error-dismiss">✕</button>
          </div>
        )}

        <aside className={`config-aside ${isConfigOpen ? 'visible' : ''}`}>
          <form onSubmit={handleGenerate} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div className="form-group">
              <label>Quick Test Prompts</label>
              <div className="test-prompt-grid">
                {TEST_PROMPTS.map((tp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`test-prompt-btn ${selectedTestPrompt === idx ? 'active' : ''}`}
                    onClick={() => handleTestPromptSelect(idx)}
                  >
                    {tp.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-divider">
              <span>OR CUSTOM PROMPT</span>
            </div>

            <div className="form-group">
              <label>Scene Description</label>
              <textarea 
                name="content" 
                placeholder="A young reporter chases a thief through a Moroccan marketplace..." 
                rows={3}
                required={selectedTestPrompt < 0}
                disabled={selectedTestPrompt >= 0}
              />
            </div>

            <div className="form-group">
              <label>Characters</label>
              <input 
                name="characters" 
                placeholder="A young reporter with a quiff, his white terrier..." 
                disabled={selectedTestPrompt >= 0}
              />
            </div>

            <div className="form-group">
              <label>Setting / Location</label>
              <input 
                name="setting" 
                placeholder="A sun-drenched North African souk..." 
                disabled={selectedTestPrompt >= 0}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Camera Angle</label>
                <select name="cameraAngle" disabled={selectedTestPrompt >= 0}>
                  <option value="medium shot">Medium Shot</option>
                  <option value="wide establishing shot">Wide / Establishing</option>
                  <option value="close-up">Close-up</option>
                  <option value="bird's eye view">Bird's Eye</option>
                  <option value="low-angle dramatic">Low Angle</option>
                  <option value="over-the-shoulder">Over the Shoulder</option>
                </select>
              </div>

              <div className="form-group">
                <label>Speech Bubble</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    className={`btn ${speechOverlay ? 'btn-primary' : ''}`}
                    onClick={() => setSpeechOverlay(!speechOverlay)}
                    style={{ width: 'auto', padding: '12px 16px', flex: '0 0 auto' }}
                  >
                    {speechOverlay ? 'ON' : 'OFF'}
                  </button>
                  {speechOverlay && (
                    <input 
                      name="dialogue" 
                      placeholder="Dialogue..." 
                      style={{ flex: 1, padding: '12px 8px', fontSize: '0.8rem' }}
                      disabled={selectedTestPrompt >= 0}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Extra Parameters</label>
              <input name="params" placeholder="Additional style details..." disabled={selectedTestPrompt >= 0} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                ⚡ RENDER PANEL
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={closeConfig}
                style={{ flex: 0.5 }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </aside>
      </main>
    </div>
  );
}

export default App;
