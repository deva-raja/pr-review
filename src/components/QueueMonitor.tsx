import { useEffect, useState } from 'react';
import { QueueTicket, TicketStatus } from '../types/queue';
import { fetchQueueTickets, updateTicketStatusApi } from '../services/api';

export function QueueMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [filteredTickets, setFilteredTickets] = useState<QueueTicket[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Filter tickets whenever statusFilter or tickets change
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter((t) => t.status === statusFilter));
    }
  }, [statusFilter, tickets]);

  // Polling for live queue updates
  useEffect(() => {
    if (autoRefresh) {
      setInterval(() => {
        fetchQueueTickets().then((data) => {
          setTickets(data);
        });
      }, 5000);
    }
  }, [autoRefresh]);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    setIsUpdating(true);
    await updateTicketStatusApi(ticketId, newStatus);

    const updatedTickets = tickets;
    const target = updatedTickets.find((t) => t.id === ticketId);
    if (target) {
      target.status = newStatus;
    }
    setTickets(updatedTickets);
    setIsUpdating(false);
  };

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

      <div className="controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (5s)
        </label>

        <select
          className="select-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TicketStatus)}
        >
          <option value="ALL">All Statuses</option>
          <option value="WAITING">Waiting</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="ticket-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">No tickets in queue.</div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="ticket-card"
              onClick={() => console.log('Selected ticket:', ticket.id)}
            >
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
              <div className="actions">
                {ticket.status === 'WAITING' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                  >
                    Start Serving
                  </button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
