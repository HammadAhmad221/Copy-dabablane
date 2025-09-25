const BASE_URL = '/front/v1/payment';

const FRONT_PAYMENT = {
  BASE: BASE_URL,
  getCmi: () => `${BASE_URL}/cmi/initiate`,
};

export default FRONT_PAYMENT;