import { useEffect, useState } from 'react';
import {
  fetchExpenseTypes,
  fetchStaff,
  fetchHostFarmers,
  fetchPostageRates,
  fetchSetting,
} from '../api/client';
import { EXPENSE_TYPES } from '../constants/expenseTypes';
import { STAFF_MASTER, FARMER_MASTER } from '../constants/parties';
import { POSTAGE_RATES } from '../constants/postageRates';
import { DEFAULT_INSTALLMENT_THRESHOLD } from '../constants/installmentSettings';

// マスタはサーバーから取得する。接続できない場合は constants/ の初期値で画面を動かす。
const useMaster = (loader, fallback) => {
  const [data, setData] = useState(fallback);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    loader()
      .then((result) => { if (active) { setData(result); setOffline(false); } })
      .catch(() => { if (active) { setData(fallback); setOffline(true); } });
    return () => { active = false; };
    // loader/fallback は呼び出し側で固定されている前提（モジュール直下の関数・定数）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, setData, offline };
};

// §1-2 費用種別マスタ
export const useExpenseTypes = (enabledOnly = false) => {
  const { data, setData, offline } = useMaster(() => fetchExpenseTypes(enabledOnly), EXPENSE_TYPES);
  return {
    types: data,
    setTypes: setData,
    getType: (key) => data.find((t) => t.key === key),
    offline,
  };
};

// サービススタッフ／派遣先・農家マスタ（サーバーは staffId / hostId、画面は id で扱う）
export const useParties = () => {
  const staff = useMaster(
    () => fetchStaff().then((list) => list.map((s) => ({ ...s, id: s.staffId }))),
    STAFF_MASTER
  );
  const hosts = useMaster(
    () => fetchHostFarmers().then((list) => list.map((h) => ({ ...h, id: h.hostId }))),
    FARMER_MASTER
  );
  return {
    staff: staff.data,
    hostFarmers: hosts.data,
    offline: staff.offline || hosts.offline,
  };
};

// 郵送費レート表
export const usePostageRates = () => {
  const { data, offline } = useMaster(fetchPostageRates, POSTAGE_RATES);
  return {
    rates: data,
    origins: [...new Set(data.map((r) => r.origin))],
    destinations: [...new Set(data.map((r) => r.destination))],
    getAmount: (origin, destination) =>
      data.find((r) => r.origin === origin && r.destination === destination)?.amount ?? null,
    offline,
  };
};

// 分割提案の上限金額
export const useInstallmentThreshold = () => {
  const [threshold, setThreshold] = useState(DEFAULT_INSTALLMENT_THRESHOLD);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSetting('installmentThreshold')
      .then((setting) => {
        if (!active) return;
        setThreshold(Number(setting?.value) || DEFAULT_INSTALLMENT_THRESHOLD);
        setOffline(false);
      })
      .catch(() => { if (active) setOffline(true); });
    return () => { active = false; };
  }, []);

  return { threshold, setThreshold, offline };
};
