import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { ensureDefaultRbacData } from '../services/rbacService.js';

export const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find({}).sort({ name: 1 });
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({}).populate('permissions').sort({ name: 1 });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (permissions !== undefined && !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }
    let permissionIds = [];
    if (permissions && permissions.length > 0) {
      const permissionDocs = await Permission.find({ name: { $in: permissions } });
      permissionIds = permissionDocs.map((p) => p._id);
    }
    const created = await Role.create({
      name: name.trim().toUpperCase(),
      permissions: permissionIds
    });
    const populated = await Role.findById(created._id).populate('permissions');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Role đã tồn tại' });
    }
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (permissions !== undefined && !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }
    let permissionIds = [];
    if (permissions && permissions.length > 0) {
      const permissionDocs = await Permission.find({ name: { $in: permissions } });
      permissionIds = permissionDocs.map((p) => p._id);
    }
    const updated = await Role.findByIdAndUpdate(
      id,
      { permissions: permissionIds },
      { new: true }
    ).populate('permissions');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const bootstrapRbac = async (req, res, next) => {
  try {
    const result = await ensureDefaultRbacData();
    res.json({
      success: true,
      data: result,
      message: 'RBAC bootstrapped successfully'
    });
  } catch (error) {
    next(error);
  }
};
