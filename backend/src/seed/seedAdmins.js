import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const superAdmins = [
    {
        name: 'Super Admin 1',
        email: 'superadmin1@techstore.com',
        password: 'SuperAdmin@123',
        role: 'SUPER_ADMIN',
        isActive: true,
        superAdminType: 'FOUNDING',
    },
    {
        name: 'Super Admin 2',
        email: 'superadmin2@techstore.com',
        password: 'SuperAdmin@456',
        role: 'SUPER_ADMIN',
        isActive: true,
        superAdminType: 'FOUNDING',
    },
    {
        name: 'Super Admin 3',
        email: 'superadmin3@techstore.com',
        password: 'SuperAdmin@789',
        role: 'SUPER_ADMIN',
        isActive: true,
        superAdminType: 'FOUNDING',
    },
];

const seed = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        for (const adminData of superAdmins) {
            const existing = await User.findOne({ email: adminData.email });
            if (existing) {
                console.log(`⚠️  Skipped (already exists): ${adminData.email}`);
                continue;
            }
            const user = new User(adminData);
            await user.save(); // triggers bcrypt pre-save hook
            console.log(`✅ Created: ${adminData.name} <${adminData.email}>`);
        }

        console.log('\n📋 Super Admin Accounts:');
        console.log('┌─────────────────────────────────────────┬──────────────────────┐');
        console.log('│ Email                                   │ Password             │');
        console.log('├─────────────────────────────────────────┼──────────────────────┤');
        superAdmins.forEach(a => {
            console.log(`│ ${a.email.padEnd(39)} │ ${a.password.padEnd(20)} │`);
        });
        console.log('└─────────────────────────────────────────┴──────────────────────┘');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
