import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface HappyHourTimerProps {
  endTime?: string;
  promoTitle?: string;
  onExpire?: () => void;
}

export const HappyHourTimer: React.FC<HappyHourTimerProps> = ({
  endTime = '23:59:59',
  promoTitle = 'HAPPY HOUR PROMO',
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 1,
    minutes: 30,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Parse target end time (assuming HH:mm:ss format for today)
    const now = new Date();
    const parts = endTime.split(':');
    const target = new Date();
    if (parts.length === 3) {
      target.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10), 0);
    } else {
      target.setHours(23, 59, 59, 0);
    }

    const interval = setInterval(() => {
      const diffMs = target.getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        if (onExpire) onExpire();
        clearInterval(interval);
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  if (isExpired) {
    return (
      <View style={s.expiredBanner}>
        <Text style={s.expiredText}>⏰ PROMO HAPPY HOUR HAS ENDED</Text>
      </View>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={s.timerContainer}>
      <View style={s.badge}>
        <Text style={s.badgeText}>🔥 {promoTitle.toUpperCase()}</Text>
      </View>

      <View style={s.timeRow}>
        <View style={s.timeBox}>
          <Text style={s.timeNum}>{pad(timeLeft.hours)}</Text>
          <Text style={s.timeUnit}>JAM</Text>
        </View>

        <Text style={s.colon}>:</Text>

        <View style={s.timeBox}>
          <Text style={s.timeNum}>{pad(timeLeft.minutes)}</Text>
          <Text style={s.timeUnit}>MENIT</Text>
        </View>

        <Text style={s.colon}>:</Text>

        <View style={s.timeBox}>
          <Text style={s.timeNum}>{pad(timeLeft.seconds)}</Text>
          <Text style={s.timeUnit}>DETIK</Text>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  timerContainer: {
    backgroundColor: '#FFDD00',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    color: '#FFDD00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 42,
  },
  timeNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  timeUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: '#666666',
    fontFamily: 'monospace',
  },
  colon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  expiredBanner: {
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666666',
    fontFamily: 'monospace',
  },
});
