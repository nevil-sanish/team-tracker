import React, { useState, useMemo } from 'react';
import {
  LayoutGrid, List, Filter, AlertCircle, MessageSquare,
  Paperclip, Plus, X, Trash2, GripVertical, ChevronDown, Edit3, CheckCircle, Circle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative, priorityMeta, statusMeta } from '../lib/utils';
import { saveTask, deleteTask, updateTaskDoc } from '../lib/dataService';
import { saveActivity } from '../lib/dataService';
import Avatar from '../components/Avatar';

const USER_COLORS = ['#f97316','#22c55e','#eab308','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1','#a855f7'];
function getUserColor(members, task) {
  if (!members?.length || !task.assigneeId) return USER_COLORS[0];
  const idx = members.findIndex(m => m.id === task.assigneeId);
  return idx >= 0 ? USER_COLORS[idx % USER_COLORS.length] : USER_COLORS[0];
}

const COLUMNS = ['todo', 'in_progress', 'done'];

export default function Tasks() {
  const store = useStore();
  const { activeGroup, user, addNotification, mode,
    addTask, removeTask, updateTask, moveTask,
    addPersonalTask, removePersonalTask, updatePersonalTask, movePersonalTask,
    getActiveTasks } = store;
  const tasks = getActiveTasks();
  const isGroup = mode === 'group' && !!activeGroup;
  const members = isGroup ? (activeGroup.members || []) : [];
  const [view, setView] = useState('kanban');
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const groupId = isGroup ? activeGroup.id : null;

  const visible = useMemo(() => {
    let items = [...tasks];
    if (filterPriority) items = items.filter(t => t.priority === filterPriority);
    if (filterStatus) items = items.filter(t => t.status === filterStatus);
    return items;
  }, [tasks, filterPriority, filterStatus]);

  const overdueCount = visible.filter(
    t => t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString())
  ).length;

  const handleToggleComplete = async (task) => {
    const isCompleted = task.completedBy?.includes(user?.id);
    let newCompletedBy = [...(task.completedBy || [])];
    if (isCompleted) {
      newCompletedBy = newCompletedBy.filter(id => id !== user?.id);
    } else {
      if (user?.id) newCompletedBy.push(user.id);
    }

    const assignedIds = task.assigneeIds?.length > 0 ? task.assigneeIds : members.map(m => m.id);
    const allDone = assignedIds.length > 0 && assignedIds.every(id => newCompletedBy.includes(id));
    const anyDone = newCompletedBy.length > 0;
    const newStatus = allDone ? 'done' : (anyDone ? 'in_progress' : 'todo');

    const updates = { completedBy: newCompletedBy, status: newStatus, updatedAt: new Date().toISOString(), updatedBy: user?.name || 'You' };
    
    if (isGroup && groupId) {
      updateTask(task.id, updates);
      await updateTaskDoc(groupId, task.id, updates);
    } else {
      updatePersonalTask(task.id, updates);
    }
  };

  const handleAddTask = async (task) => {
    const fullTask = { ...task, updatedBy: user?.name || 'You', comments: 0, attachments: 0 };
    if (isGroup && groupId) {
      await saveTask(groupId, fullTask);
      await saveActivity(groupId, { kind: 'task_created', actorName: user?.name || 'You', target: task.title, at: new Date().toISOString() });
    } else {
      addPersonalTask(fullTask);
    }
    addNotification({ title: 'Task Created', message: `"${task.title}" has been added`, type: 'info', section: 'Tasks' });
    setShowNewTask(false);
  };

  const handleRemoveTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (isGroup && groupId) {
      await deleteTask(groupId, id);
      if (task) await saveActivity(groupId, { kind: 'task_deleted', actorName: user?.name || 'You', target: task.title, at: new Date().toISOString() });
    } else {
      removePersonalTask(id);
    }
    addNotification({ title: 'Task Deleted', message: `"${task?.title || 'A task'}" has been removed`, type: 'alert', section: 'Tasks' });
  };

  const handleEditTask = async (id, updates) => {
    if (isGroup && groupId) {
      updateTask(id, updates);
      await updateTaskDoc(groupId, id, updates);
    } else {
      updatePersonalTask(id, updates);
    }
    addNotification({ title: 'Task Updated', message: 'Task has been updated', type: 'info', section: 'Tasks' });
    setEditTask(null);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="tab-group">
            <button className={`tab-item ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')} style={{ fontSize: 11, padding: '4px 12px' }}>
              <LayoutGrid size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Kanban
            </button>
            <button className={`tab-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} style={{ fontSize: 11, padding: '4px 12px' }}>
              <List size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> List
            </button>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={13} /> Filters
          </button>

          {(filterPriority || filterStatus) && (
            <button onClick={() => { setFilterPriority(null); setFilterStatus(null); }} style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <AlertCircle size={13} /> {overdueCount} overdue
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {visible.length} tasks
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-2 animate-slide-in" style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Priority:</span>
          {Object.entries(priorityMeta).map(([key, meta]) => (
            <button
              key={key}
              className="chip"
              onClick={() => setFilterPriority(filterPriority === key ? null : key)}
              style={{
                background: filterPriority === key ? meta.bg : 'var(--color-bg-tertiary)',
                color: filterPriority === key ? meta.text : 'var(--color-text-muted)',
                borderColor: filterPriority === key ? meta.color : 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
              {meta.label}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: 'var(--color-border-default)', margin: '0 4px' }} />

          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Status:</span>
          {Object.entries(statusMeta).map(([key, meta]) => (
            <button
              key={key}
              className="chip"
              onClick={() => setFilterStatus(filterStatus === key ? null : key)}
              style={{
                background: filterStatus === key ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)',
                color: filterStatus === key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              {meta.label}
            </button>
          ))}
      </div>
      )}

      {/* Views */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
        {view === 'kanban' ? (
          <KanbanView tasks={visible} members={members} user={user} onToggleComplete={handleToggleComplete} onRemove={handleRemoveTask} onEdit={setEditTask} />
        ) : (
          <ListView tasks={visible} members={members} user={user} onToggleComplete={handleToggleComplete} onRemove={handleRemoveTask} onEdit={setEditTask} />
        )}
      </div>

      {showNewTask && (
        <NewTaskModal
          members={members}
          onClose={() => setShowNewTask(false)}
          onSave={handleAddTask}
        />
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          members={members}
          onClose={() => setEditTask(null)}
          onSave={handleEditTask}
        />
      )}
    </div>
  );
}

/* ── Kanban View ── */
function KanbanView({ tasks, members, user, onToggleComplete, onRemove, onEdit }) {
  return (
    <div className="h-full overflow-x-auto px-6 py-5" style={{ display: 'flex', gap: 16 }}>
      {COLUMNS.map(status => {
        const items = tasks.filter(t => t.status === status);
        const meta = statusMeta[status];
        return (
          <div key={status} style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>{meta.label}</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)', padding: '2px 6px', background: 'var(--color-bg-tertiary)', borderRadius: 5 }}>{String(items.length).padStart(2, '0')}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20, paddingRight: 4 }}>
              {items.length === 0 ? (
                <div style={{ border: '2px dashed var(--color-border-default)', borderRadius: 12, padding: '28px 0', textAlign: 'center', fontSize: 11, fontStyle: 'italic', color: 'var(--color-text-disabled)' }}>Drop tasks here</div>
              ) : (
                items.map(t => <TaskCard key={t.id} task={t} members={members} user={user} dim={status === 'done'} onToggleComplete={() => onToggleComplete(t)} onRemove={() => onRemove(t.id)} onClick={() => onEdit?.(t)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Task Card ── */
function TaskCard({ task, members, user, dim, onToggleComplete, onRemove, compact, onClick }) {
  const overdue = task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().toDateString());
  const dueLabel = `Due Date : ${new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const pMeta = priorityMeta[task.priority] || priorityMeta.medium;
  const isCompletedByMe = task.completedBy?.includes(user?.id);
  const assignedUsers = members.filter(m => task.assigneeIds?.includes(m.id));
  const displayUsers = assignedUsers.length > 0 ? assignedUsers : members;

  return (
    <div
      className="card group"
      onClick={onClick}
      style={{
        padding: compact ? 6 : 8,
        opacity: dim ? 0.5 : 1,
        cursor: 'pointer',
        borderLeft: '3px solid var(--color-border-subtle)', // Neutral fallback
        borderColor: undefined,
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: overdue ? 'rgba(239, 68, 68, 0.1)' : undefined
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className="btn-ghost btn-icon" style={{ width: 20, height: 20, color: isCompletedByMe ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {isCompletedByMe ? <CheckCircle size={16} fill="var(--color-success)" color="var(--color-bg-primary)" /> : <Circle size={16} />}
          </button>
          <span className="badge" style={{ background: pMeta.bg, color: pMeta.text }}>
            {pMeta.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
            fontWeight: overdue ? 700 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {overdue && <AlertCircle size={11} />}
            {dueLabel}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            className="btn-ghost btn-icon"
            style={{ width: 22, height: 22, color: 'var(--color-danger)', opacity: 0.6, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h4 style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        lineHeight: 1.3,
        textDecoration: dim ? 'line-through' : 'none',
      }}>
        {task.title}
      </h4>

      {!compact && task.description && (
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      {task.progress !== undefined && task.status === 'in_progress' && (
        <div>
          <div style={{ height: 4, background: 'var(--color-bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${task.progress}%`, background: 'linear-gradient(90deg, var(--color-accent), var(--color-info))', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 2, display: 'block' }}>{task.progress}%</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
          {task.comments > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={12} /> {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Paperclip size={12} /> {task.attachments}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--color-bg-tertiary)', padding: '2px 4px', borderRadius: 12 }}>
          {displayUsers.map(u => (
            <div key={u.id} style={{ position: 'relative' }}>
              <Avatar name={u.name} size="xs" />
              {task.completedBy?.includes(u.id) && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--color-bg-primary)', borderRadius: '50%' }}>
                  <CheckCircle size={8} color="var(--color-success)" fill="var(--color-success)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── List View ── */
function ListView({ tasks, members, user, onRemove, onToggleComplete, onEdit }) {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="card-flat" style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-tertiary)' }}>
              {['', 'Task', 'Status', 'Priority', 'Due', 'Assignees', 'Updated', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(t => {
              const overdue = t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString());
              const pMeta = priorityMeta[t.priority] || priorityMeta.medium;
              const sMeta = statusMeta[t.status] || statusMeta.todo;
              const isCompletedByMe = t.completedBy?.includes(user?.id);
              const assignedUsers = members.filter(m => t.assigneeIds?.includes(m.id));
              const displayUsers = assignedUsers.length > 0 ? assignedUsers : members;

              return (
                <tr key={t.id} style={{ borderTop: '1px solid var(--color-border-subtle)', cursor: 'pointer', transition: 'background 0.15s', background: overdue ? 'rgba(239, 68, 68, 0.1)' : undefined }} onClick={() => onEdit?.(t)}>
                  <td style={{ padding: '10px 14px', width: 40 }}>
                    <button onClick={(e) => { e.stopPropagation(); onToggleComplete(t); }} className="btn-ghost btn-icon" style={{ width: 20, height: 20, color: isCompletedByMe ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {isCompletedByMe ? <CheckCircle size={16} fill="var(--color-success)" color="var(--color-bg-primary)" /> : <Circle size={16} />}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontWeight: 600, color: t.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{t.description}</p>
                  </td>
                  <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, color: sMeta.color }}>{sMeta.label}</span></td>
                  <td style={{ padding: '10px 14px' }}><span className="badge" style={{ background: pMeta.bg, color: pMeta.text }}>{pMeta.label}</span></td>
                  <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: overdue ? 700 : 400 }}>
                    {overdue && <AlertCircle size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />}
                    Due Date : {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {displayUsers.map(u => <Avatar key={u.id} name={u.name} size="xs" />)}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>{t.updatedBy} · {formatRelative(t.updatedAt)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={(e) => { e.stopPropagation(); onEdit?.(t); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24 }}><Edit3 size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onRemove(t.id); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No tasks match your filters.</div>}
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onSave, members }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [assigneeIds, setAssigneeIds] = useState([]);

  const toggleAssignee = (id) => setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Task</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (title.trim()) { onSave({ title: title.trim(), description, priority, status: 'todo', dueDate, assigneeIds, completedBy: [] }); } }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
            <input className="input" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</label>
            <textarea className="input" placeholder="What needs to be done?" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                {Object.entries(priorityMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Due Date</label>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          {members.length > 0 && <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Assign To</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map((m, i) => { const sel = assigneeIds.includes(m.id); const c = USER_COLORS[i % USER_COLORS.length]; return (
                <button key={m.id} type="button" onClick={() => toggleAssignee(m.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: sel ? c : 'var(--color-border-default)', background: sel ? `${c}18` : 'var(--color-bg-tertiary)', color: sel ? c : 'var(--color-text-muted)', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{m.name}
                </button>
              ); })}
            </div>
          </div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTaskModal({ task, members, onClose, onSave }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assigneeIds, setAssigneeIds] = useState(task.assigneeIds || []);

  const toggleAssignee = (id) => setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(task.id, { title: title.trim(), description, priority, dueDate, assigneeIds, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Edit Task</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                {Object.entries(priorityMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Due Date</label>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          {members.length > 0 && <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Assign To</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map((m, i) => { const sel = assigneeIds.includes(m.id); const c = USER_COLORS[i % USER_COLORS.length]; return (
                <button key={m.id} type="button" onClick={() => toggleAssignee(m.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: sel ? c : 'var(--color-border-default)', background: sel ? `${c}18` : 'var(--color-bg-tertiary)', color: sel ? c : 'var(--color-text-muted)', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{m.name}
                </button>
              ); })}
            </div>
          </div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
