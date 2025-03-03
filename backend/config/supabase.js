const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cajqjrhxzphqdzaovsiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhanFqcmh4enBocWR6YW92c2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzY0ODksImV4cCI6MjA1NjUxMjQ4OX0.2Y1ZXC4YeUuf83ZL53qdR50OwTvffRC7VpPpwV2Wn3I';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
