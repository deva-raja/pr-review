import { useEffect, useState } from 'react';
import { QueueTicket } from '../types/queue';
import { fetchQueueTickets } from '../services/api';

export function QueueMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchQueueTickets()
      .then((data) => {
        if (isMounted) {
          setTickets(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="empty-state">Loading active queue...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Queue Management Monitor</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Live service desk operations</p>
        </div>
      </header>

      <div className="ticket-list">
        {tickets.length === 0 ? (
          <div className="empty-state">No tickets in queue.</div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-info">
                <div className="ticket-title">
                  <span className="ticket-id">{ticket.id}</span>
                  <span className="ticket-customer">{ticket.customerName}</span>
                  <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                </div>
                <div className="ticket-meta">
                  Service: {ticket.serviceType} | Est. wait: {ticket.estimatedWaitMinutes} mins | Arrived: {ticket.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
