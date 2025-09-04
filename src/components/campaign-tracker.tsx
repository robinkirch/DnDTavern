'use client';
import { useState } from 'react';
import type { Campaign, TimeOfDay } from '@/lib/types';
import { updateCampaign } from '@/lib/data-service';
import { useI18n } from '@/context/i18n-context';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sun, SunMoon, Moon, Sunrise, Sunset, Wind, Cloud, CloudRain, CloudSun, CloudSnow, CloudLightning, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignTrackerProps {
  campaign: Campaign;
  setCampaign: (campaign: Campaign) => void;
}

const timeOfDayIcons: { [key in TimeOfDay]: JSX.Element } = {
  morning: <Sunrise className="h-5 w-5" />,
  noon: <Sun className="h-5 w-5" />,
  evening: <Sunset className="h-5 w-5" />,
  night: <Moon className="h-5 w-5" />,
};

const timeOfDayOrder: TimeOfDay[] = ['morning', 'noon', 'evening', 'night'];

const weatherIcons: { [key: string]: JSX.Element } = {
    'sunny': <Sun className="h-5 w-5 text-yellow-400" />,
    'cloudy': <Cloud className="h-5 w-5 text-gray-400" />,
    'rain': <CloudRain className="h-5 w-5 text-blue-400" />,
    'sun-cloud': <CloudSun className="h-5 w-5 text-yellow-400" />,
    'windy': <Wind className="h-5 w-5 text-gray-400" />,
    'snow': <CloudSnow className="h-5 w-5 text-white" />,
    'storm': <CloudLightning className="h-5 w-5 text-yellow-400" />,
};

const getWeatherIcon = (weatherName: string | null) => {
    if (!weatherName) return <Cloud className="h-5 w-5 text-gray-400" />;
    const lowerCaseName = weatherName.toLowerCase();
    const key = Object.keys(weatherIcons).find(k => lowerCaseName.includes(k));
    return key ? weatherIcons[key] : <Cloud className="h-5 w-5 text-gray-400" />;
}

export function CampaignTracker({ campaign, setCampaign }: CampaignTrackerProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState(campaign.tracking.currentRegionId);

  const handleAdvanceTime = async () => {
    let { day, month, year } = campaign.tracking.currentDate;
    const { daysPerMonth, monthsPerYear } = campaign.calendarSettings;

    const currentIndex = timeOfDayOrder.indexOf(campaign.tracking.currentTimeOfDay);
    const nextIndex = (currentIndex + 1) % timeOfDayOrder.length;
    const newTimeOfDay = timeOfDayOrder[nextIndex];

    if (newTimeOfDay === 'morning') {
      day += 1;
      if (day > daysPerMonth) {
        day = 1;
        month += 1;
        if (month > monthsPerYear) {
          month = 1;
          year += 1;
        }
      }
    }
    
    // Roll for new weather
    const region = campaign.weatherSettings.regions.find(r => r.id === selectedRegion);
    let newWeather = campaign.tracking.currentWeather;
    if (region && region.conditions.length > 0) {
        const totalProb = region.conditions.reduce((acc, c) => acc + c.probability, 0);
        if (totalProb !== 100) {
             toast({ variant: 'destructive', title: t('Weather Error'), description: t('Weather probabilities for the region must sum to 100%.') });
        } else {
            const roll = Math.random() * 100;
            let cumulativeProb = 0;
            for (const condition of region.conditions) {
                cumulativeProb += condition.probability;
                if (roll <= cumulativeProb) {
                    newWeather = condition.name;
                    break;
                }
            }
        }
    }


    const updatedCampaign: Campaign = {
        ...campaign,
        tracking: {
            ...campaign.tracking,
            currentDate: { day, month, year },
            currentTimeOfDay: newTimeOfDay,
            currentWeather: newWeather,
        }
    };
    
    const savedCampaign = await updateCampaign(updatedCampaign);
    setCampaign(savedCampaign);
  };

  const handleRegionChange = async (regionId: string) => {
    setSelectedRegion(regionId);
    const updatedCampaign: Campaign = { ...campaign, tracking: { ...campaign.tracking, currentRegionId: regionId }};
    const savedCampaign = await updateCampaign(updatedCampaign);
    setCampaign(savedCampaign);
    toast({ title: t("Region Updated"), description: t("The active region has been changed.")})
  };

  const { day, month, year } = campaign.tracking.currentDate;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="font-headline">{t('Campaign Tracker')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-6 justify-between items-center">
         <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
                {timeOfDayIcons[campaign.tracking.currentTimeOfDay]}
                <span className='font-semibold text-lg'>{t(campaign.tracking.currentTimeOfDay)}</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className='flex items-center gap-2'>
                {getWeatherIcon(campaign.tracking.currentWeather)}
                <span className='font-semibold text-lg'>{campaign.tracking.currentWeather || t('N/A')}</span>
            </div>
             <div className="h-10 w-px bg-border" />
            <div className='flex items-center gap-2'>
                 <span className='font-semibold text-lg'>{`${t('Day')} ${day}, ${t('Month')} ${month}, ${year} ${campaign.calendarSettings.yearName}`}</span>
            </div>
         </div>
         <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Select onValueChange={handleRegionChange} value={selectedRegion ?? ''} disabled={campaign.weatherSettings.regions.length === 0}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('Select a region...')} />
                </SelectTrigger>
                <SelectContent>
                    {campaign.weatherSettings.regions.map(region => (
                        <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleAdvanceTime}>
                {t('Advance Time')} <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
         </div>
      </CardContent>
    </Card>
  );
}
