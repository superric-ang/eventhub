import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { transformKeys } from '../utils/transformers';

export const getMyPaymentAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      success: true,
      paymentAccounts: (data || []).map((a: any) => transformKeys(a)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { accountType, accountName, accountDetails, isDefault } = req.body;

    if (!accountType || !['bank', 'paynow'].includes(accountType)) {
      return res.status(400).json({ message: 'accountType must be bank or paynow' });
    }

    if (!accountName) {
      return res.status(400).json({ message: 'accountName is required' });
    }

    if (accountType === 'bank') {
      if (!accountDetails?.bankName || !accountDetails?.accountNumber) {
        return res.status(400).json({ message: 'Bank accounts require bankName and accountNumber' });
      }
    } else if (accountType === 'paynow') {
      if (!accountDetails?.paynowNumber || !accountDetails?.paynowType) {
        return res.status(400).json({ message: 'PayNow accounts require paynowNumber and paynowType' });
      }
      if (!['mobile', 'uen', 'email'].includes(accountDetails.paynowType)) {
        return res.status(400).json({ message: 'paynowType must be mobile, uen, or email' });
      }
    }

    if (isDefault) {
      await supabase
        .from('payment_accounts')
        .update({ is_default: false })
        .eq('user_id', req.user!.id);
    }

    const { data, error } = await supabase
      .from('payment_accounts')
      .insert({
        user_id: req.user!.id,
        account_type: accountType,
        account_name: accountName,
        account_details: accountDetails || {},
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ success: true, paymentAccount: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { data: account, error: fetchError } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    if (account.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { accountType, accountName, accountDetails, isDefault } = req.body;

    const updates: Record<string, any> = {};
    if (accountType) {
      if (!['bank', 'paynow'].includes(accountType)) {
        return res.status(400).json({ message: 'accountType must be bank or paynow' });
      }
      updates.account_type = accountType;
    }
    if (accountName) updates.account_name = accountName;
    if (accountDetails) updates.account_details = accountDetails;
    if (isDefault !== undefined) updates.is_default = isDefault;

    if (isDefault) {
      await supabase
        .from('payment_accounts')
        .update({ is_default: false })
        .eq('user_id', req.user!.id)
        .neq('id', req.params.id);
    }

    const { data, error } = await supabase
      .from('payment_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, paymentAccount: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { data: account, error: fetchError } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    if (account.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('payment_accounts')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, message: 'Payment account deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const setDefaultPaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { data: account, error: fetchError } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    if (account.user_id !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await supabase
      .from('payment_accounts')
      .update({ is_default: false })
      .eq('user_id', req.user!.id)
      .neq('id', req.params.id);

    const { data, error } = await supabase
      .from('payment_accounts')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, paymentAccount: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
