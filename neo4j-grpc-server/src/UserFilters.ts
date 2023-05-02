import { UserPreferences, readUserPreferences } from './UserPreferences';
import haversine from 'haversine-distance';

export const compareUserFilters = async (userId1: string, userId2: string) => {
  const user1Data = await readUserPreferences(userId1);
  const user2Data = await readUserPreferences(userId2);

  const filterConstants = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    let inner_valid = true;
    Object.entries(userDataA.f_constant).forEach((entry) => {
      const key = entry[0].toString();
      const value = entry[1] != null ? entry[1].toString() : null;
      if (key == `type` || value == null) return;
      if (userDataB.a_constant[key] != value) {
        inner_valid = false;
      }
    });
    return inner_valid;
  };

  let valid = true;

  valid = valid && filterConstants(user1Data, user2Data);
  valid = valid && filterConstants(user2Data, user1Data);

  const filterDistance = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    const aDistance = userDataA.f_custom.distance;
    const aLong = userDataA.a_custom.long;
    const aLat = userDataA.a_custom.lat;

    const bLong = userDataB.a_custom.long;
    const bLat = userDataB.a_custom.lat;

    if (aDistance && aLong && aLat) {
      if (!bLong || !bLat) return false;
      const aCord = { lat: aLat, lng: aLong };
      const bCord = { lat: bLat, lng: bLong };
      const dist = haversine(aCord, bCord);

      if (dist > aDistance) return false;
    }
    return true;
  };

  valid = valid && filterDistance(user1Data, user2Data);
  valid = valid && filterDistance(user2Data, user1Data);

  return valid;
};
