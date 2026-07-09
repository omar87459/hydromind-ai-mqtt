# HydroMind AI

An AI-powered hydroponic farm management platform prototype. Select a hydroponic
method, choose a crop, monitor simulated IoT sensor readings, step through growth
stages, and get AI-generated recommendations for keeping every parameter on target.

Built for a hackathon demo — the backend runs on a local JSON dataset with a
structure designed for a straightforward swap to a real database later.

## What's included

1. **Crop Database** — Lettuce, Basil, Tomato, Cucumber, and Hydroponic Barley
   Fodder, each with full environmental requirements and per-stage targets.
2. **Hydroponic Methods** — DWC, NFT, Ebb and Flow, Drip, Aeroponics, and Vertical
   Farming, each with advantages, limitations, and compatible crops.
3. **Interactive Growth Stages** — Seedling → Vegetative → Flowering/Fruiting →
   Harvest, with pH/EC/light/temperature targets and AI notes that update per crop
   and stage.
4. **AI Monitoring Dashboard** — simulated live sensor readings (pH, EC, water
   temp, air temp, humidity, water level, light intensity) compared against the
   selected crop/stage's ideal ranges, with Ideal / Warning / Critical status.
5. **AI Decision Engine** — backend rule-based logic that turns an out-of-range
   reading into a problem description, severity, recommended action, an
   automatic action suggestion, and a confidence score.
6. **AI Knowledge Assistant (RAG)** — your question is matched against a local
   markdown knowledge base (`backend/knowledge_base/*.md`) using TF-IDF
   retrieval, and an answer is generated directly from the retrieved passages
   — no external LLM call, fully offline, with retrieved sources shown in the UI.
7. **System Architecture Concept** — Farm Sensors → Local Farm Server → AI Cloud
   Platform → Satellite Communication Layer → Farmer Dashboard, shown as a
   conceptual diagram (not a live integration).
8. **Automation Control Panel** — toggles for the main water pump, nutrient
   pump, pH dosing pump, grow lights, and cooling fan, with AI-suggested
   ON/OFF state and reasoning for each.
9. **ML Engine** — a real scikit-learn pipeline (`backend/ml_engine/`) trained
   on a synthetic hydroponic dataset: a RandomForestClassifier predicts
   Ideal/Warning/Critical health status, a RandomForestRegressor predicts a
   0-100 risk score, and a rule-based safety layer can override both when a
   reading is outside physiologically safe limits.
10. **AI Model Lab** — a page showing dataset size, model type, features used,
    training status, last-trained date, and test-set accuracy for both
    models, plus a live "try it" panel to run predictions against custom
    sensor values.

## Project structure

```
hydromind-ai/
├── render.yaml                Render Blueprint (backend deployment config)
├── backend/                   FastAPI app
│   ├── app/
│   │   ├── main.py            App entrypoint, CORS, router registration
│   │   ├── data_store.py      Data access layer — local JSON or Supabase (see below)
│   │   ├── supabase_client.py Lazy Supabase client, used only if configured
│   │   ├── models.py          Pydantic request/response schemas
│   │   ├── routers/           crops, methods, sensors, analyze, assistant, ml, rag
│   │   └── services/          ai_decision_engine, sensor_simulator, knowledge_assistant
│   ├── data/                  crops.json, methods.json, knowledge_base.json
│   ├── supabase_setup/         schema.sql + seed.py for the Supabase migration
│   ├── ml_engine/              synthetic dataset generator, training script,
│   │                           prediction service, safety layer (see below)
│   ├── knowledge_base/         markdown corpus for the RAG assistant (*.md)
│   ├── rag_engine/              chunker, TF-IDF retriever, answer generator
│   └── requirements.txt
└── frontend/                  React + Vite app
    ├── vercel.json             SPA rewrite config (Vercel deployment)
    └── src/
        ├── api/                axios client + endpoint wrappers
        ├── context/            AppContext (shared crop/method/stage selection)
        ├── pages/               one file per section, incl. ModelLabPage
        └── components/          layout, crops, methods, growth, monitoring,
                                  automation, assistant, architecture
```

## Backend setup

Requires Python 3.10+.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/crops` | List all crops |
| GET | `/crops/{crop_id}` | Full detail for one crop, including per-stage targets |
| GET | `/crops/{crop_id}/methods` | Hydroponic methods compatible with a crop |
| GET | `/methods` | List all hydroponic methods |
| GET | `/methods/{method_id}` | Full detail for one method |
| GET | `/methods/{method_id}/crops` | Crops compatible with a method |
| GET | `/sensor-data?crop_id=&stage=` | One simulated live sensor reading, evaluated against the crop/stage's ideal ranges if provided |
| POST | `/analyze` | Runs the rule-based AI Decision Engine against a reading for a crop + stage |
| POST | `/assistant` | Legacy keyword-overlap assistant over `data/knowledge_base.json` |
| GET | `/ml/model-info` | Dataset size, model type, features, accuracy, last-trained date |
| POST | `/ml/predict-health` | Predicts Ideal/Warning/Critical from a raw sensor reading (RandomForestClassifier) |
| POST | `/ml/predict-risk` | Predicts a 0-100 risk score from a raw sensor reading (RandomForestRegressor) |
| POST | `/ml/recommend-action` | Full ML bundle: health status, risk score, detected problem, recommended action, confidence, explanation |
| POST | `/rag/ask` | Ask a hydroponics question, answered via TF-IDF retrieval over `knowledge_base/*.md` with sources |

## Frontend setup

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

The app will be live at `http://localhost:5173`. It reads the backend URL from
`VITE_API_URL` (see `frontend/.env`), defaulting to `http://localhost:8000`.

## ML Engine setup (health/risk prediction models)

The FastAPI backend loads pre-trained model files, so you need to generate
the dataset and train once before the `/ml/*` endpoints will work (they
return `503` until then). From the `backend/` directory, with the venv active:

```bash
# 1. Install the ML dependencies (already included in requirements.txt)
pip install scikit-learn pandas numpy joblib

# 2. Generate the synthetic training dataset
python -m ml_engine.dataset_generator
# -> writes backend/ml_engine/data/synthetic_dataset.csv (~8,500 rows)

# 3. Train the models
python -m ml_engine.train
# -> writes backend/ml_engine/models/health_model.pkl, risk_model.pkl, metadata.json

# 4. Run the API (if not already running)
uvicorn app.main:app --reload --port 8000
```

Test the endpoints:

```bash
curl http://localhost:8000/ml/model-info

curl -X POST http://localhost:8000/ml/recommend-action \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "lettuce", "hydroponic_method": "nft", "growth_stage": "vegetative",
    "ph": 7.2, "ec": 1.1, "water_temperature": 20, "air_temperature": 21,
    "humidity": 60, "water_level": 80, "light_intensity": 300,
    "light_hours": 16, "days_after_planting": 15
  }'
```

The dataset is generated by labeling randomly sampled sensor readings with
the same rule-based `ai_decision_engine` logic already used by `/analyze` —
see the docstring in `backend/ml_engine/dataset_generator.py` for the full
rationale, and swap in real farm sensor history there when it's available.
`ml_engine/safety_rules.py` defines hard physiological safety limits that
override the ML prediction (forcing `Critical`) regardless of model
confidence — see that file for the exact bounds.

## RAG Assistant setup

The `/rag/ask` endpoint builds its TF-IDF index in memory from
`backend/knowledge_base/*.md` on first use — no separate build step is
required, and no extra dependencies beyond `scikit-learn` (already in
`requirements.txt`). To add knowledge, drop a new `.md` file into
`backend/knowledge_base/` using `##` headings to mark retrievable
sections — no restart needed beyond the next server reload.

```bash
curl -X POST http://localhost:8000/rag/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Why is pH important?"}'
```

## Moving beyond the local JSON dataset

All data access goes through `backend/app/data_store.py`. Every function there
(`get_crops`, `get_crop_by_id`, `get_methods_for_crop`, etc.) is written as if it
queried a database, and now actually can: set `SUPABASE_URL` and `SUPABASE_KEY`
in the environment and it reads from Supabase instead of the JSON files — no
code changes, no router/service changes. See "Cloud Deployment" below.

## Cloud Deployment (Vercel + Render + Supabase)

This gives you a permanent public URL, reachable from any device, instead of
only `localhost`. It needs free accounts on three services — I can't create
these for you, but everything on the code side is already prepared. Do these
in order:

### 1. Create the Supabase project and load the data

1. Go to [supabase.com](https://supabase.com), create a free account and a new
   project. Wait for it to finish provisioning (~2 minutes).
2. Open **SQL Editor** in the Supabase dashboard, paste the contents of
   `backend/supabase_setup/schema.sql`, and run it. This creates the `crops`,
   `methods`, and `knowledge_base` tables with public read access.
3. Get your credentials from **Project Settings → API**:
   - `Project URL` → this is `SUPABASE_URL`
   - `anon public` key → this is `SUPABASE_KEY` (used by the deployed backend for read-only access)
   - `service_role` key → only used locally, once, to seed the data (never deployed, never shared)
4. Create `backend/supabase_setup/.env` (already gitignored) with:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```
5. From `backend/`, with the venv active, run the seed script once:
   ```bash
   python -m supabase_setup.seed
   ```
   This loads `crops.json`, `methods.json`, and `knowledge_base.json` into
   Supabase. Re-run it any time you edit those files and want the cloud copy
   to match.

### 2. Push the code to GitHub

```bash
cd ~/Projects/hydromind-ai
git add .
git commit -m "Prepare HydroMind AI for cloud deployment"
```

Create an empty repo on [github.com/new](https://github.com/new) (don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 3. Deploy the backend on Render

1. Go to [render.com](https://render.com), create a free account.
2. **New → Blueprint**, connect your GitHub repo. Render reads `render.yaml`
   at the repo root and configures the service automatically (Python, build
   command that installs deps + generates the dataset + trains the ML
   models, start command that runs uvicorn).
3. Before/after the first deploy, open the service's **Environment** tab and
   set:
   - `SUPABASE_URL` — same value as above
   - `SUPABASE_KEY` — the **anon** key (not the service role key — this runs
     on a public server)
   - `CORS_ORIGINS` — leave blank for now; you'll set this after step 4
4. Deploy. Once live, note the backend's URL (something like
   `https://hydromind-ai-backend.onrender.com`) — test it:
   `curl https://your-backend.onrender.com/crops`

   Render's free tier spins the service down after inactivity — the first
   request after idling can take ~30-60s to wake back up.

### 4. Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com), create a free account.
2. **Add New → Project**, import the same GitHub repo.
3. Set **Root Directory** to `frontend` (Vercel auto-detects Vite).
4. Add an environment variable: `VITE_API_URL` = your Render backend URL
   from step 3 (e.g. `https://hydromind-ai-backend.onrender.com`).
5. Deploy. You'll get a public URL like `https://hydromind-ai.vercel.app` —
   this works from any device, on any network.

### 5. Lock down CORS (recommended)

Now that you know the Vercel URL, go back to the Render service's
Environment tab and set `CORS_ORIGINS` to it (e.g.
`https://hydromind-ai.vercel.app`), then redeploy. This restricts the API to
requests from your actual frontend instead of any origin.

### 6. Verify

Open the Vercel URL on your phone (or any other device) and click through
Crops → Live Monitoring → AI Knowledge Assistant to confirm everything
talks to the deployed backend correctly.

## Notes on the prototype scope

- Sensor readings are simulated (`backend/app/services/sensor_simulator.py`),
  not read from real hardware.
- The rule-based AI Decision Engine (`/analyze`) is deterministic range-checking
  logic, not a trained model — it's also what labels the ML training data (see
  `ml_engine/dataset_generator.py`).
- The ML models (`ml_engine/`) are trained on synthetic, rule-generated data,
  not real farm sensor history — accuracy numbers on the AI Model Lab page
  reflect performance on a held-out synthetic test set, not real-world
  validation. Retrain on real data by pointing `train.py` at a CSV with the
  same columns.
- The RAG assistant (`/rag/ask`) uses TF-IDF retrieval over a small,
  hand-written markdown corpus and extractive (non-LLM) answer generation —
  see the docstrings in `backend/rag_engine/` for what a production version
  (embeddings + vector DB + LLM synthesis) would swap in.
- The satellite/cloud architecture (System Architecture page) is a conceptual
  diagram only; no satellite or cloud integration is implemented.

## Roadmap (documented, not yet implemented)

The following were scoped in planning but are not built in this pass —
noted here so the next iteration has a clear starting brief:

- **Bilingual support (English/Arabic)** — a language switcher with full
  UI translation and RTL/LTR layout switching, driven by `src/i18n/en.json`
  and `src/i18n/ar.json`, keeping numbers/units/scientific terms (pH, EC,
  DWC, NFT) unchanged across languages.
- **User authentication** — Admin / Farm Owner / Viewer roles, with Farm
  Owners scoped to their own farms, and a multi-farm data model (Farm Name,
  ID, Location, Method, Sensors, Crop Database, AI Dashboard per farm).
- **Satellite Monitoring Dashboard** — a map-based page showing all
  registered farms with health score, active crop, sensor status, AI
  alerts, water consumption, and connectivity status per farm (conceptual
  visualization, not real satellite integration).
