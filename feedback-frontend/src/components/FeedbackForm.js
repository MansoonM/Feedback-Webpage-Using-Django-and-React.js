import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/feedback/';

/* ---- Confetti helper (canvas-based) ----
   Small lightweight implementation: spawns colored rectangles/particles,
   animates them with gravity, rotation and fade. */
function useConfetti() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // create canvas & add to body
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  const fire = (opts = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const count = opts.count || 120;
    const colors = opts.colors || ['#ff6b6b','#ffd166','#06d6a0','#118ab2','#5a189a','#ff8fab'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: (Math.random() * canvas.width),
        y: -20 - Math.random() * 200,
        w: 6 + Math.random()*10,
        h: 8 + Math.random()*12,
        color: colors[Math.floor(Math.random()*colors.length)],
        vx: (Math.random()-0.5) * 7,
        vy: Math.random() * 4 + 2,
        rot: Math.random()*360,
        drot: (Math.random()-0.5)*6,
        opacity: 1
      });
    }

    let last = performance.now();
    const gravity = 0.18;
    const friction = 0.998;
    const decay = 0.008;

    function draw(now) {
      const dt = now - last;
      last = now;
      ctx.clearRect(0,0,canvas.width,canvas.height);

      for (let p of particles) {
        p.vy += gravity * (dt/16);
        p.vx *= friction;
        p.x += p.vx * (dt/16);
        p.y += p.vy * (dt/16);
        p.rot += p.drot * (dt/16);
        p.opacity -= decay * (dt/16);

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      }

      // remove faded
      while (particles.length && particles[0].opacity <= 0) particles.shift();

      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);

    // safety: stop after 6s
    setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      if (canvas) ctx && ctx.clearRect(0,0,canvas.width,canvas.height);
    }, 6000);
  };

  return { fire };
}

/* ---- Stars component (same as before) ---- */
const Stars = ({ value, onChange }) => {
  const arr = [1,2,3,4,5];
  return (
    <div className="star-row" role="radiogroup" aria-label="Rating">
      {arr.map(n => (
        <div
          key={n}
          className={`star ${value >= n ? 'on' : ''}`}
          role="radio"
          aria-checked={value === n}
          tabIndex={0}
          onClick={() => onChange(n)}
          onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onChange(n); }}
          title={`${n} star${n>1 ? 's' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill={value >= n ? '#FFB020' : 'none'} stroke={value >= n ? '#FF8A00' : '#bfc7d6'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 .587l3.668 7.431L23.6 9.75l-5.45 5.312L19.5 23 12 19.412 4.5 23l1.35-7.938L.4 9.75l7.933-1.732L12 .587z"/>
          </svg>
        </div>
      ))}
    </div>
  );
};

function FeedbackForm() {
  const [form, setForm] = useState({ name: '', email: '', rating: 5, comments: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [recent, setRecent] = useState([]);

  const confetti = useConfetti();

  useEffect(() => { fetchRecent(); }, []);

  async function fetchRecent(){
    try {
      const res = await axios.get(API_URL);
      setRecent(res.data);
    } catch(err) {
      console.warn('Could not fetch recent feedbacks', err.message || err);
    }
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!form.email.trim()) e.email = 'Please enter your email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.rating || form.rating < 1 || form.rating > 5) e.rating = 'Select a rating';
    return e;
  };

  const handleChange = (key) => (ev) => {
    setForm(prev => ({...prev, [key]: ev.target.value}));
    setErrors(prev => ({...prev, [key]: null}));
  };

  const handleRating = (val) => {
    setForm(prev => ({...prev, rating: val}));
    setErrors(prev => ({...prev, rating: null}));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await axios.post(API_URL, form);
      setSuccess({ message: 'Thanks! Your feedback is received 🎉', data: res.data });
      setForm({ name: '', email: '', rating: 5, comments: '' });
      fetchRecent();

      // fire confetti with colors & count tuned by rating
      const count = 60 + (res.data.rating * 25);
      confetti.fire({ count, colors: ['#ff6b6b','#ffd166','#06d6a0','#118ab2','#5a189a','#ff8fab'] });

      // clear success after 5s
      setTimeout(()=> setSuccess(null), 5000);
    } catch (err) {
      setErrors({ submit: 'Failed to submit. Please try again.' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-4 fade-in-up">
      <div className="row g-3 align-items-center">
        <div className="col-12 col-md-8">
          <div className="form-title">Share your thoughts</div>
          <div className="helper">Quick feedback helps us improve. Takes less than a minute.</div>
        </div>
        <div className="col-12 col-md-4 text-md-end">
          <small className="badge" style={{background:'linear-gradient(90deg,var(--accent1),var(--accent2))', color:'#fff', padding:'.45rem .7rem', borderRadius:12}}>Live • {recent.length} responses</small>
        </div>
      </div>

      {success && (
        <div className="mt-3 success-burst">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <strong>{success.message}</strong>
              <div className="small text-muted">We really appreciate your time.</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'.85rem', color:'#2a7f6b'}}>Rating: {success.data.rating} / 5</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-3">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Full name</label>
            <input
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Aarti Singh"
              value={form.name}
              onChange={handleChange('name')}
              disabled={submitting}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="you@domain.com"
              value={form.email}
              onChange={handleChange('email')}
              disabled={submitting}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="col-12">
            <label className="form-label d-block">Rate your experience</label>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <Stars value={form.rating} onChange={handleRating} />
              <div className="helper" style={{marginLeft:12}}>
                <small>{form.rating} / 5 — {form.rating >=4 ? 'Loved it' : form.rating ===3 ? 'It was okay' : 'Needs improvement'}</small>
              </div>
            </div>
            {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
          </div>

          <div className="col-12">
            <label className="form-label">Comments (optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Tell us what you liked or what we can improve..."
              value={form.comments}
              onChange={handleChange('comments')}
              disabled={submitting}
            ></textarea>
          </div>

          {errors.submit && <div className="col-12"><div className="alert alert-danger">{errors.submit}</div></div>}

          <div className="col-12 d-flex gap-2">
            <button type="submit" className="btn btn-animated" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Sending...' : 'Send feedback'}
            </button>

            <button type="button" className="btn btn-outline-secondary" onClick={()=> {
              setForm({ name:'', email:'', rating:5, comments:'' });
              setErrors({});
            }} disabled={submitting}>
              Reset
            </button>
          </div>
        </div>
      </form>

      <hr className="my-4" />

      <div>
        <h6 style={{fontWeight:700}}>Recent feedback</h6>
        <div style={{maxHeight:220, overflowY:'auto', paddingRight:6}}>
          {recent.length === 0 && <div className="text-muted small">No feedback yet — be the first!</div>}
          {recent.map(fb => (
            <div key={fb.id} className="recent-card mt-2">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{fb.name}</strong>
                  <div className="small text-muted">{new Date(fb.created_at).toLocaleString()}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'.95rem', fontWeight:700}}>{fb.rating} <span style={{color:'#ffb020'}}>★</span></div>
                </div>
              </div>
              {fb.comments && <div className="mt-2">{fb.comments}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackForm;
