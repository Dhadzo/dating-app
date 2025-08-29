import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LocationData {
  state: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface StateCity {
  state: string;
  cities: string[];
}

// Hook to get all states
export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_coordinates')
        .select('state')
        .order('state');

      if (error) throw error;

      // Get unique states and sort them
      const uniqueStates = [
        ...new Set(data?.map((item) => item.state) || [])
      ].sort();

      return uniqueStates;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });
};

// Hook to get cities by state (or all cities if no state selected)
export const useCitiesByState = (state: string | undefined) => {
  return useQuery({
    queryKey: ['cities', state],
    queryFn: async () => {
      let query = supabase.from('city_coordinates').select('city');

      if (state) {
        query = query.eq('state', state);
      }

      const { data, error } = await query.order('city');

      if (error) throw error;

      // Get unique cities and sort them
      const uniqueCities = [
        ...new Set(data?.map((item) => item.city) || [])
      ].sort();

      return uniqueCities;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });
};

// Hook to get coordinates for a specific city/state
export const useCityCoordinates = (
  city: string | undefined,
  state: string | undefined
) => {
  return useQuery({
    queryKey: ['coordinates', city, state],
    queryFn: async () => {
      if (!city || !state) return null;

      const { data, error } = await supabase
        .from('city_coordinates')
        .select('latitude, longitude')
        .eq('city', city)
        .eq('state', state)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!city && !!state,
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000 // 24 hours
  });
};

// Hook to get all location data (states and cities)
export const useLocationData = () => {
  return useQuery({
    queryKey: ['location-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_coordinates')
        .select('state, city, latitude, longitude')
        .order('state, city');

      if (error) throw error;

      // Group cities by state
      const statesMap = new Map<string, string[]>();
      const coordinatesMap = new Map<string, { lat: number; lng: number }>();

      data?.forEach((item) => {
        const state = item.state;
        const city = item.city;
        const key = `${city}, ${state}`;

        // Add city to state
        if (!statesMap.has(state)) {
          statesMap.set(state, []);
        }
        if (!statesMap.get(state)?.includes(city)) {
          statesMap.get(state)?.push(city);
        }

        // Store coordinates
        coordinatesMap.set(key, {
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude)
        });
      });

      // Convert to arrays and sort
      const states = Array.from(statesMap.keys()).sort();
      const citiesByState: Record<string, string[]> = {};
      states.forEach((state) => {
        citiesByState[state] = statesMap.get(state)?.sort() || [];
      });

      return {
        states,
        citiesByState,
        coordinates: Object.fromEntries(coordinatesMap)
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });
};
