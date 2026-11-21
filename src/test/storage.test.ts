import { describe, it, expect } from 'vitest';
import { getStore } from '../lib/storage';
import { Complaint } from '../lib/types';

describe('Data Storage & Repository Management', () => {
  it('loads seed environmental datasets correctly', () => {
    const store = getStore();
    expect(store.getWasteBins().length).toBeGreaterThan(0);
    expect(store.getRecyclingFacilities().length).toBeGreaterThan(0);
    expect(store.getWaterbodies().length).toBeGreaterThan(0);
    expect(store.getAQIStations().length).toBeGreaterThan(0);
    expect(store.getTrafficObservations().length).toBeGreaterThan(0);
  });

  it('adds and retrieves civic complaints in newest-first order', () => {
    const store = getStore();
    const initialCount = store.getComplaints().length;

    const newComplaint: Complaint = {
      id: `test-cmp-${Date.now()}`,
      userDisplayName: 'Test Contributor',
      caption: 'Test overflowing waste container',
      category: 'overflowing_bin',
      coordinates: [91.75, 26.18],
      address: 'Pan Bazar Test St, Guwahati',
      imageUrl: 'https://example.com/test.jpg',
      constituencyId: 'gauhati-east',
      constituencyName: 'Gauhati East (No. 53)',
      status: 'Reported',
      createdAt: new Date().toISOString(),
    };

    store.addComplaint(newComplaint);

    const complaints = store.getComplaints();
    expect(complaints.length).toBe(initialCount + 1);
    expect(complaints[0].id).toBe(newComplaint.id);

    const retrieved = store.getComplaintById(newComplaint.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.caption).toBe(newComplaint.caption);
  });
});
