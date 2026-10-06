import React from 'react';
import { UserProfile, UserPreferences, SharedTripGroup } from '../../types';
import { JoinSquadModal } from './JoinSquadModal';

interface JoinGroupModalProps {
  currentUser: UserProfile;
  onJoined: (group: SharedTripGroup) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
  initialInviteCode?: string;
  onUserSwitch?: (user: UserProfile) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = (props) => {
  return <JoinSquadModal {...props} />;
};
