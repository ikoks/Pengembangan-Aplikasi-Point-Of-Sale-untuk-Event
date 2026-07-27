import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PosMainScreen from '../screens/PosMainScreen';
import PaymentCashScreen from '../screens/PaymentCashScreen';
import PaymentNonCashScreen from '../screens/PaymentNonCashScreen';
import ReceiptScreen from '../screens/ReceiptScreen';

export type PosStackParamList = {
  POS_MAIN: undefined;
  PAYMENT_CASH: { totalAmount: number };
  PAYMENT_NON_CASH: { totalAmount: number };
  RECEIPT: { transactionData: any };
};

const Stack = createStackNavigator<PosStackParamList>();

export default function PosStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="POS_MAIN"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="POS_MAIN" component={PosMainScreen as any} />
      <Stack.Screen name="PAYMENT_CASH" component={PaymentCashScreen as any} />
      <Stack.Screen name="PAYMENT_NON_CASH" component={PaymentNonCashScreen as any} />
      <Stack.Screen name="RECEIPT" component={ReceiptScreen as any} />
    </Stack.Navigator>
  );
}
