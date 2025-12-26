import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const DB_PATH = path.join(__dirname, '../../data/profiles.json');

// Типы
interface Profile {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    accountType: 'child' | 'adult' | 'senior';
    createdAt: string;
    updatedAt: string;
}

interface ProfilesDB {
    profiles: Profile[];
}

// Инициализация БД
const initDB = (): ProfilesDB => {
    const dataDir = path.join(__dirname, '../../data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        const initialData: ProfilesDB = { profiles: [] };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }

    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading profiles DB:', error);
        return { profiles: [] };
    }
};

// Сохранение БД
const saveDB = (db: ProfilesDB): void => {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

// GET /api/profiles/:phone - Получить все профили по номеру телефона
router.get('/:phone', (req, res) => {
    try {
        const { phone } = req.params;
        const cleanPhone = phone.replace(/\D/g, '');

        const db = initDB();
        const userProfiles = db.profiles.filter(p => p.phone.replace(/\D/g, '') === cleanPhone);

        res.json({ success: true, profiles: userProfiles });
    } catch (error: any) {
        console.error('Get profiles error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/profiles - Создать новый профиль
router.post('/', (req, res) => {
    try {
        const { phone, firstName, lastName, accountType } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }

        const db = initDB();
        const cleanPhone = phone.replace(/\D/g, '');

        const newProfile: Profile = {
            id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phone: cleanPhone,
            firstName: firstName || '',
            lastName: lastName || '',
            accountType: accountType || 'adult',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.profiles.push(newProfile);
        saveDB(db);

        res.json({ success: true, profile: newProfile });
    } catch (error: any) {
        console.error('Create profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/profiles/:id - Обновить профиль
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, accountType } = req.body;

        const db = initDB();
        const profileIndex = db.profiles.findIndex(p => p.id === id);

        if (profileIndex === -1) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Обновляем поля
        if (firstName !== undefined) db.profiles[profileIndex].firstName = firstName;
        if (lastName !== undefined) db.profiles[profileIndex].lastName = lastName;
        if (accountType !== undefined) db.profiles[profileIndex].accountType = accountType;
        db.profiles[profileIndex].updatedAt = new Date().toISOString();

        saveDB(db);

        res.json({ success: true, profile: db.profiles[profileIndex] });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/profiles/:id - Удалить профиль
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const db = initDB();
        const profileIndex = db.profiles.findIndex(p => p.id === id);

        if (profileIndex === -1) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Проверка: не удалять последний профиль пользователя
        const phone = db.profiles[profileIndex].phone;
        const userProfiles = db.profiles.filter(p => p.phone === phone);

        if (userProfiles.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the last profile'
            });
        }

        db.profiles.splice(profileIndex, 1);
        saveDB(db);

        res.json({ success: true, message: 'Profile deleted' });
    } catch (error: any) {
        console.error('Delete profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
