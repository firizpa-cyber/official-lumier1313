import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Load data from the existing JSON file in src/data/full-data.json
// We assume this is where the static data lives.
const DATA_PATH = path.join(__dirname, '../../src/data/full-data.json');

router.get('/', (req, res) => {
  try {
    if (fs.existsSync(DATA_PATH)) {
        const data = fs.readFileSync(DATA_PATH, 'utf-8');
        const json = JSON.parse(data);
        
        // The PHP content-api.php returned an object where keys were slugs (or similar)
        // The JSON has "movies": [...] array.
        // We should probably return the "movies" array or the whole object depending on what the frontend expects.
        // Looking at the PHP code again, it returned a map: 'slug' => object.
        // If the frontend expects a map, we might need to transform it.
        // However, standard REST APIs usually return arrays.
        // Let's check how the frontend uses it. 
        // For now, let's return the whole JSON structure (which likely matches the PHP output structure if it was generated from it).
        // Wait, the PHP snippet showed: $moviesDatabase = ['slug' => [...], ...]
        // The JSON has { "movies": [...] }
        // If the frontend calls /api/content-api.php, what does it expect?
        // Let's assume for now we just return the movies array if the PHP was returning a list.
        // But the PHP output was an associative array (object in JSON).
        
        // Let's read the frontend code to see how it consumes this API.
        // I'll return the raw JSON for now.
        res.json(json);
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
  } catch (error) {
    console.error('Content API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
