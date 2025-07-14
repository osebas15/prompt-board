import React, { useState, useEffect } from 'react';
import { Zap, Plus, Play, Pause, Clock, CheckCircle } from 'lucide-react';
import type { Workflow } from '../types';

interface WorkflowsManagerProps {
  className?: string;
}

export const WorkflowsManager: React.FC<WorkflowsManagerProps> = ({ className }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock workflows for demo
  useEffect(() => {
    setTimeout(() => {
      setWorkflows([
        {
          id: '1',
          user_id: 'user1',
          name: 'Daily Prompt Backup',
          description: 'Automatically backup all prompts daily',
          steps: [],
          variables: {},
          is_active: true,
          is_template: false,
          schedule: '0 0 * * *',
          tags: ['backup', 'daily'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          run_count: 15,
        },
        {
          id: '2',
          user_id: 'user1',
          name: 'Content Generation Pipeline',
          description: 'Generate content based on user inputs',
          steps: [],
          variables: {},
          is_active: false,
          is_template: true,
          tags: ['content', 'generation'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          run_count: 0,
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id 
        ? { ...workflow, is_active: !workflow.is_active }
        : workflow
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Automation Workflows</h2>
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
          <Plus className="w-4 h-4 mr-1" />
          New Workflow
        </button>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
              <p className="text-gray-600 mb-4">Create your first automation workflow to get started.</p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" />
                Create Workflow
              </button>
            </div>
          ) : (
            workflows.map(workflow => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                      {workflow.is_template && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Template
                        </span>
                      )}
                      {workflow.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Pause className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{workflow.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {workflow.schedule && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Scheduled
                        </div>
                      )}
                      <div>
                        {workflow.tags.map(tag => (
                          <span key={tag} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleWorkflow(workflow.id)}
                      className={`
                        inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
                        ${workflow.is_active 
                          ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }
                      `}
                    >
                      {workflow.is_active ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
