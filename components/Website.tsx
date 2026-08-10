// This is a new file: components/Website.tsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BlogPost, WebsiteSettingsConfig, ForumPost, ForumReply, Product } from '../types';
import { Button, Modal, Input, Textarea, Label, Select, Badge } from './ui';

const BlogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<BlogPost, 'id' | 'authorId' | 'publishedDate'> | BlogPost) => void;
    existingPost: BlogPost | null;
}> = ({ isOpen, onClose, onSave, existingPost }) => {
    const { state } = useAppContext();
    const { blogCategories } = state;
    const [formData, setFormData] = useState<Partial<BlogPost>>({});
    const [tagsInput, setTagsInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (existingPost) {
                setFormData(existingPost);
                setTagsInput(existingPost.tags?.join(', ') || '');
            } else {
                setFormData({
                    title: '',
                    content: '',
                    imageUrl: '',
                    categoryId: '',
                    layout: 'standard',
                    tags: []
                });
                setTagsInput('');
            }
        }
    }, [isOpen, existingPost]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTagsInput = e.target.value;
        setTagsInput(newTagsInput);
        const tagsArray = newTagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, tags: tagsArray }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const postData = {
            ...formData,
            title: formData.title || '',
            content: formData.content || '',
            layout: formData.layout || 'standard',
        };
        
        if (existingPost) {
            onSave({ ...existingPost, ...postData });
        } else {
            onSave(postData as Omit<BlogPost, 'id' | 'authorId' | 'publishedDate'>);
        }
        onClose();
    };
    
    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" onClick={handleSubmit}>Simpan Postingan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingPost ? 'Ubah Postingan' : 'Buat Postingan Baru'} footer={footer} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="title" value={formData.title || ''} onChange={handleInputChange} placeholder="Judul Postingan" required />
                <div className="grid grid-cols-2 gap-4">
                    <Select name="categoryId" value={formData.categoryId || ''} onChange={handleInputChange} required>
                        <option value="">-- Pilih Kategori --</option>
                        {blogCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </Select>
                    <Select name="layout" value={formData.layout || 'standard'} onChange={handleInputChange}>
                        <option value="standard">Layout Standar</option>
                        <option value="image-header">Layout Gambar Header</option>
                    </Select>
                </div>
                <Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} placeholder="URL Gambar Utama (opsional)" />
                <Input value={tagsInput} onChange={handleTagsChange} placeholder="Tags (pisahkan dengan koma, cth: bisnis, teknologi)" />
                <Textarea name="content" value={formData.content || ''} onChange={handleInputChange} placeholder="Tulis konten blog di sini..." required rows={12} />
            </form>
        </Modal>
    );
};

export const BlogListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { blogPosts, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    const handleOpenModal = (post: BlogPost | null) => {
        setEditingPost(post);
        setModalOpen(true);
    };

    const handleSavePost = (postData: Omit<BlogPost, 'id' | 'authorId' | 'publishedDate'> | BlogPost) => {
        if ('id' in postData) {
            dispatch({ type: 'modules/blog/updatePost', payload: postData });
        } else {
            dispatch({ type: 'modules/blog/addPost', payload: postData });
        }
    };
    
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog Perusahaan</h1>
                <Button onClick={() => handleOpenModal(null)}>Buat Postingan Baru</Button>
            </div>
            <div className="flex-grow space-y-6 overflow-y-auto">
                {blogPosts.map(post => {
                    const category = state.blogCategories.find(c => c.id === post.categoryId);
                    return (
                        <div key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                            {post.imageUrl && post.layout === 'image-header' && (
                                <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                            )}
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{post.title}</h2>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 my-2">
                                <span>Oleh <strong>{staffMap.get(post.authorId) || 'Unknown'}</strong></span>
                                <span>{new Date(post.publishedDate).toLocaleDateString('id-ID')}</span>
                                {category && 
                                    <Badge variant="primary">{category.name}</Badge>
                                }
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2 flex-grow">
                                {post.imageUrl && post.layout === 'standard' && (
                                    <img src={post.imageUrl} alt={post.title} className="w-48 h-auto float-left mr-4 mb-2 rounded-md" />
                                )}
                                {post.content}
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <div className="flex gap-2 flex-wrap">
                                    {(post.tags || []).map(tag => <Badge key={tag}>{tag}</Badge>)}
                                </div>
                                <button onClick={() => handleOpenModal(post)} className="text-sm font-semibold text-primary-500 hover:underline flex-shrink-0">Ubah</button>
                            </div>
                        </div>
                    )
                })}
            </div>
            <BlogModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSavePost} existingPost={editingPost} />
        </div>
    );
};


const ForumPostModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { dispatch } = useAppContext();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'modules/forum/addPost', payload: { title, content } });
        onClose();
    };
    
    const footer = <Button onClick={handleSubmit}>Kirim</Button>;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Topik Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul Topik" required />
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tulis sesuatu..." required rows={5}/>
            </form>
        </Modal>
    );
};

export const ForumListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { forumPosts, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activePostId && replyContent) {
            dispatch({ type: 'modules/forum/addReply', payload: { postId: activePostId, content: replyContent } });
            setReplyContent('');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forum / FAQ</h1>
                <Button onClick={() => setModalOpen(true)}>Buat Topik Baru</Button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
                {forumPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h2 className="text-xl font-bold">{post.title}</h2>
                        <p className="text-xs text-gray-500">oleh {staffMap.get(post.authorId)} - {new Date(post.timestamp).toLocaleString('id-ID')}</p>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{post.content}</p>
                        
                        <div className="mt-4">
                            <button onClick={() => setActivePostId(activePostId === post.id ? null : post.id)} className="text-sm text-primary-500 font-semibold">
                                {post.replies.length} Balasan
                            </button>
                        </div>

                        {activePostId === post.id && (
                             <div className="mt-4 pl-4 border-l-2 dark:border-gray-600 space-y-4">
                                {post.replies.map(reply => (
                                    <div key={reply.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                        <p className="text-xs font-bold">{staffMap.get(reply.authorId)}</p>
                                        <p className="text-sm">{reply.content}</p>
                                    </div>
                                ))}
                                <form onSubmit={handleReplySubmit} className="flex gap-2">
                                    <Input value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Tulis balasan..." required />
                                    <Button type="submit">Balas</Button>
                                </form>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <ForumPostModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export const WebsitePage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Website</h1>
            <p className="mt-4">This is the main website view. Content is managed via other modules.</p>
        </div>
    );
};